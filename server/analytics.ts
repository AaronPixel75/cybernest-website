import crypto from 'node:crypto';
import type { Request } from 'express';
import type Database from 'better-sqlite3';
import {
  computeDateComparisonWindow,
  computeDeltaPct,
  formatTimeBucket,
  normalizeReferrerSource,
  parseUserAgent,
  resolveApproximateRegion,
} from './analyticsUtils.ts';
import type {
  AnalyticsEventType,
  AnalyticsGranularity,
  AnalyticsOverviewPayload,
} from '../src/types/cms.ts';

function getDailySalt(db: Database.Database, dayKey: string): string {
  const existing = db
    .prepare('SELECT salt_hex FROM analytics_salts WHERE day_key = ?')
    .get(dayKey) as { salt_hex: string } | undefined;
  if (existing) return existing.salt_hex;

  const newSalt = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT OR IGNORE INTO analytics_salts (day_key, salt_hex) VALUES (?, ?)').run(
    dayKey,
    newSalt,
  );
  const row = db
    .prepare('SELECT salt_hex FROM analytics_salts WHERE day_key = ?')
    .get(dayKey) as { salt_hex: string };
  return row.salt_hex;
}

export function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

export function computePrivacyVisitorHash(
  db: Database.Database,
  ip: string,
  userAgent: string,
): string {
  const dayKey = new Date().toISOString().slice(0, 10);
  const salt = getDailySalt(db, dayKey);
  const parsed = parseUserAgent(userAgent);
  return crypto
    .createHmac('sha256', salt)
    .update(`${ip}|${parsed.browser}|${parsed.os}|${parsed.device}`)
    .digest('hex')
    .slice(0, 32);
}

export interface IngestAnalyticsInput {
  sessionId: string;
  eventType: AnalyticsEventType;
  label?: string;
  pagePath?: string;
  referrer?: string;
  timezone?: string;
  durationSec?: number;
}

export function ingestAnalyticsEvent(
  db: Database.Database,
  req: Request,
  input: IngestAnalyticsInput,
): void {
  const nowIso = new Date().toISOString();
  const ua = req.headers['user-agent'] || '';
  const { device, browser, os } = parseUserAgent(ua);
  const ip = extractClientIp(req);
  const visitorHash = computePrivacyVisitorHash(db, ip, ua);
  const headerCountry =
    (req.headers['cf-ipcountry'] as string | undefined) ||
    (req.headers['x-appengine-country'] as string | undefined) ||
    (req.headers['x-vercel-ip-country'] as string | undefined) ||
    (req.headers['x-country-code'] as string | undefined);
  const region = resolveApproximateRegion(headerCountry, input.timezone);
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  const referrer = normalizeReferrerSource(input.referrer, host);
  const pagePath = (input.pagePath || '/').slice(0, 200);
  const label = (input.label || '').slice(0, 200);

  const existingSession = db
    .prepare(
      'SELECT session_id, first_seen, pageview_count, event_count, duration_sec FROM analytics_sessions WHERE session_id = ?',
    )
    .get(input.sessionId) as
    | {
        session_id: string;
        first_seen: string;
        pageview_count: number;
        event_count: number;
        duration_sec: number;
      }
    | undefined;

  if (!existingSession) {
    const initialDuration = Math.max(0, Math.min(7200, Math.round(input.durationSec || 0)));
    const initialPageviews = input.eventType === 'pageview' ? 1 : 1;
    const isBounce = input.eventType === 'pageview' ? 1 : 0;

    db.prepare(
      `INSERT INTO analytics_sessions
       (session_id, visitor_hash, device, browser, os, region, referrer, entry_path, first_seen, last_seen, duration_sec, pageview_count, event_count, is_bounce)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      input.sessionId,
      visitorHash,
      device,
      browser,
      os,
      region,
      referrer,
      pagePath,
      nowIso,
      nowIso,
      initialDuration,
      initialPageviews,
      1,
      isBounce,
    );
  } else {
    const elapsedFromFirst = Math.max(
      0,
      Math.round((Date.now() - new Date(existingSession.first_seen).getTime()) / 1000),
    );
    const nextDuration = Math.max(
      existingSession.duration_sec,
      Math.min(7200, Math.round(input.durationSec || elapsedFromFirst)),
    );
    const addPageview = input.eventType === 'pageview' ? 1 : 0;
    const nextPageviews = existingSession.pageview_count + addPageview;
    const nextEvents = existingSession.event_count + 1;
    const isBounce = nextPageviews <= 1 && nextEvents <= 1 && nextDuration < 10 ? 1 : 0;

    db.prepare(
      `UPDATE analytics_sessions
       SET last_seen = ?, duration_sec = ?, pageview_count = ?, event_count = ?, is_bounce = ?
       WHERE session_id = ?`,
    ).run(nowIso, nextDuration, nextPageviews, nextEvents, isBounce, input.sessionId);
  }

  if (input.eventType !== 'heartbeat') {
    db.prepare(
      `INSERT INTO analytics_events (id, session_id, visitor_hash, event_type, label, page_path, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      crypto.randomUUID(),
      input.sessionId,
      visitorHash,
      input.eventType,
      label,
      pagePath,
      nowIso,
    );
  }
}

interface SessionRow {
  session_id: string;
  visitor_hash: string;
  device: string;
  browser: string;
  os: string;
  region: string;
  referrer: string;
  entry_path: string;
  first_seen: string;
  duration_sec: number;
  pageview_count: number;
  is_bounce: number;
}

interface EventRow {
  session_id: string;
  visitor_hash: string;
  event_type: string;
  label: string;
  page_path: string;
  created_at: string;
}

export function queryAnalyticsOverview(
  db: Database.Database,
  startIso: string,
  endIso: string,
  granularity: AnalyticsGranularity,
): AnalyticsOverviewPayload {
  const { startMs, endMs, prevStartMs, prevEndMs } = computeDateComparisonWindow(startIso, endIso);
  const startFull = new Date(startMs).toISOString();
  const endFull = new Date(endMs).toISOString();
  const prevStartFull = new Date(prevStartMs).toISOString();
  const prevEndFull = new Date(prevEndMs).toISOString();

  const currentSessions = db
    .prepare(
      `SELECT session_id, visitor_hash, device, browser, os, region, referrer, entry_path, first_seen, duration_sec, pageview_count, is_bounce
       FROM analytics_sessions
       WHERE first_seen >= ? AND first_seen <= ?`,
    )
    .all(startFull, endFull) as SessionRow[];

  const previousSessions = db
    .prepare(
      `SELECT session_id, visitor_hash, duration_sec, pageview_count, is_bounce
       FROM analytics_sessions
       WHERE first_seen >= ? AND first_seen <= ?`,
    )
    .all(prevStartFull, prevEndFull) as Pick<
    SessionRow,
    'session_id' | 'visitor_hash' | 'duration_sec' | 'pageview_count' | 'is_bounce'
  >[];

  const currentEvents = db
    .prepare(
      `SELECT session_id, visitor_hash, event_type, label, page_path, created_at
       FROM analytics_events
       WHERE created_at >= ? AND created_at <= ?`,
    )
    .all(startFull, endFull) as EventRow[];

  const previousEvents = db
    .prepare(
      `SELECT event_type
       FROM analytics_events
       WHERE created_at >= ? AND created_at <= ?`,
    )
    .all(prevStartFull, prevEndFull) as { event_type: string }[];

  const curVisits = currentSessions.length;
  const prevVisits = previousSessions.length;

  const curUnique = new Set(currentSessions.map((s) => s.visitor_hash)).size;
  const prevUnique = new Set(previousSessions.map((s) => s.visitor_hash)).size;

  const curAvgDur =
    curVisits > 0
      ? Math.round(
          currentSessions.reduce((acc, s) => acc + s.duration_sec, 0) / curVisits,
        )
      : 0;
  const prevAvgDur =
    prevVisits > 0
      ? Math.round(
          previousSessions.reduce((acc, s) => acc + s.duration_sec, 0) / prevVisits,
        )
      : 0;

  const curBounce =
    curVisits > 0
      ? Math.round(
          (currentSessions.filter((s) => s.is_bounce === 1).length / curVisits) * 1000,
        ) / 10
      : 0;
  const prevBounce =
    prevVisits > 0
      ? Math.round(
          (previousSessions.filter((s) => s.is_bounce === 1).length / prevVisits) * 1000,
        ) / 10
      : 0;

  const countEventsByType = (rows: { event_type: string }[], type: string) =>
    rows.filter((e) => e.event_type === type).length;

  const curContactClicks = countEventsByType(currentEvents, 'contact_click');
  const prevContactClicks = countEventsByType(previousEvents, 'contact_click');

  const curSubmissions = countEventsByType(currentEvents, 'contact_submit');
  const prevSubmissions = countEventsByType(previousEvents, 'contact_submit');

  const curTeam = countEventsByType(currentEvents, 'team_interact');
  const prevTeam = countEventsByType(previousEvents, 'team_interact');

  const curProductViews = countEventsByType(currentEvents, 'product_view');
  const prevProductViews = countEventsByType(previousEvents, 'product_view');

  // Time series buckets
  const bucketMap = new Map<
    string,
    { visits: number; visitors: Set<string>; contactClicks: number; submissions: number }
  >();
  for (const s of currentSessions) {
    const key = formatTimeBucket(s.first_seen, granularity);
    const entry = bucketMap.get(key) || {
      visits: 0,
      visitors: new Set<string>(),
      contactClicks: 0,
      submissions: 0,
    };
    entry.visits += 1;
    entry.visitors.add(s.visitor_hash);
    bucketMap.set(key, entry);
  }
  for (const ev of currentEvents) {
    if (ev.event_type !== 'contact_click' && ev.event_type !== 'contact_submit') continue;
    const key = formatTimeBucket(ev.created_at, granularity);
    const entry = bucketMap.get(key) || {
      visits: 0,
      visitors: new Set<string>(),
      contactClicks: 0,
      submissions: 0,
    };
    if (ev.event_type === 'contact_click') entry.contactClicks += 1;
    if (ev.event_type === 'contact_submit') entry.submissions += 1;
    bucketMap.set(key, entry);
  }
  const timeSeries = Array.from(bucketMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([bucket, val]) => ({
      bucket,
      visits: val.visits,
      uniqueVisitors: val.visitors.size,
      contactClicks: val.contactClicks,
      submissions: val.submissions,
    }));

  // Helper to rank map counts
  const rankSessionsBy = (picker: (s: SessionRow) => string) => {
    const counts = new Map<string, number>();
    for (const s of currentSessions) {
      const k = picker(s) || 'Unknown';
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  };

  const devices = rankSessionsBy((s) => s.device).map(([device, count]) => ({
    device,
    count,
    pct: curVisits > 0 ? Math.round((count / curVisits) * 1000) / 10 : 0,
  }));

  const browsers = rankSessionsBy((s) => s.browser)
    .slice(0, 6)
    .map(([browser, count]) => ({ browser, count }));

  const operatingSystems = rankSessionsBy((s) => s.os)
    .slice(0, 6)
    .map(([os, count]) => ({ os, count }));

  const geography = rankSessionsBy((s) => s.region)
    .slice(0, 8)
    .map(([region, count]) => ({ region, count }));

  const referrers = rankSessionsBy((s) => s.referrer)
    .slice(0, 8)
    .map(([source, count]) => ({ source, count }));

  // Top Pages
  const pageStats = new Map<string, { views: number; visitors: Set<string> }>();
  for (const ev of currentEvents) {
    if (ev.event_type !== 'pageview') continue;
    const p = ev.page_path || '/';
    const entry = pageStats.get(p) || { views: 0, visitors: new Set<string>() };
    entry.views += 1;
    entry.visitors.add(ev.visitor_hash);
    pageStats.set(p, entry);
  }
  const topPages = Array.from(pageStats.entries())
    .sort((a, b) => b[1].views - a[1].views)
    .slice(0, 10)
    .map(([path, v]) => ({ path, views: v.views, uniqueVisitors: v.visitors.size }));

  // Clicks, Team, Products
  const rankEvents = (types: string[]) => {
    const counts = new Map<string, { eventType: string; count: number }>();
    for (const ev of currentEvents) {
      if (!types.includes(ev.event_type)) continue;
      const lbl = ev.label || ev.event_type;
      const key = `${ev.event_type}::${lbl}`;
      const cur = counts.get(key) || { eventType: ev.event_type, count: 0 };
      cur.count += 1;
      counts.set(key, cur);
    }
    return Array.from(counts.entries())
      .map(([key, val]) => ({
        label: key.split('::')[1],
        eventType: val.eventType,
        count: val.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const topClicks = rankEvents(['button_click', 'contact_click']);
  const teamInteractionsBreakdown = rankEvents(['team_interact']).map(({ label, count }) => ({
    label,
    count,
  }));
  const productEngagement = rankEvents(['product_view']).map(({ label, count }) => ({
    label,
    count,
  }));

  return {
    range: {
      start: startIso,
      end: endIso,
      prevStart: prevStartFull.slice(0, 10),
      prevEnd: prevEndFull.slice(0, 10),
      granularity,
    },
    kpis: {
      totalVisits: {
        current: curVisits,
        previous: prevVisits,
        deltaPct: computeDeltaPct(curVisits, prevVisits),
      },
      uniqueVisitors: {
        current: curUnique,
        previous: prevUnique,
        deltaPct: computeDeltaPct(curUnique, prevUnique),
      },
      avgSessionDurationSec: {
        current: curAvgDur,
        previous: prevAvgDur,
        deltaPct: computeDeltaPct(curAvgDur, prevAvgDur),
      },
      bounceRatePct: {
        current: curBounce,
        previous: prevBounce,
        deltaPct: computeDeltaPct(curBounce, prevBounce),
      },
      contactClicks: {
        current: curContactClicks,
        previous: prevContactClicks,
        deltaPct: computeDeltaPct(curContactClicks, prevContactClicks),
      },
      contactSubmissions: {
        current: curSubmissions,
        previous: prevSubmissions,
        deltaPct: computeDeltaPct(curSubmissions, prevSubmissions),
      },
      teamInteractions: {
        current: curTeam,
        previous: prevTeam,
        deltaPct: computeDeltaPct(curTeam, prevTeam),
      },
      productViews: {
        current: curProductViews,
        previous: prevProductViews,
        deltaPct: computeDeltaPct(curProductViews, prevProductViews),
      },
    },
    timeSeries,
    topPages,
    devices,
    browsers,
    operatingSystems,
    geography,
    referrers,
    topClicks,
    teamInteractionsBreakdown,
    productEngagement,
  };
}
