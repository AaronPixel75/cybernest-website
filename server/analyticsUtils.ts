import type { AnalyticsGranularity } from '../src/types/cms.ts';

export interface ParsedUserAgent {
  device: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
}

export function parseUserAgent(uaRaw: string | undefined): ParsedUserAgent {
  const ua = (uaRaw || '').toLowerCase();

  let device: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/(ipad|tablet|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = 'tablet';
  } else if (
    /(mobi|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini)/i.test(ua)
  ) {
    device = 'mobile';
  }

  let browser = 'Other';
  if (ua.includes('edg/') || ua.includes('edgios') || ua.includes('edga')) {
    browser = 'Edge';
  } else if (ua.includes('opr/') || ua.includes('opera')) {
    browser = 'Opera';
  } else if (ua.includes('firefox/') || ua.includes('fxios')) {
    browser = 'Firefox';
  } else if (ua.includes('chrome/') || ua.includes('crios')) {
    browser = 'Chrome';
  } else if (ua.includes('safari/')) {
    browser = 'Safari';
  }

  let os = 'Other';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    os = 'iOS';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac os') || ua.includes('macintosh')) {
    os = 'macOS';
  } else if (ua.includes('linux') || ua.includes('x11')) {
    os = 'Linux';
  }

  return { device, browser, os };
}

export function normalizeReferrerSource(referrerRaw: string | undefined, siteHost?: string): string {
  const raw = (referrerRaw || '').trim();
  if (!raw) return 'Direct';
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (!host) return 'Direct';
    if (siteHost && host === siteHost.replace(/^www\./, '').toLowerCase()) {
      return 'Internal';
    }
    return host;
  } catch {
    return 'Direct';
  }
}

const COUNTRY_NAME_MAP: Record<string, string> = {
  UG: 'Uganda',
  KE: 'Kenya',
  TZ: 'Tanzania',
  RW: 'Rwanda',
  SS: 'South Sudan',
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  CA: 'Canada',
  NG: 'Nigeria',
  ZA: 'South Africa',
  IN: 'India',
};

export function resolveApproximateRegion(
  headerCountry: string | undefined,
  timezone: string | undefined,
): string {
  const code = (headerCountry || '').trim().toUpperCase();
  if (code && code !== 'XX' && code !== 'T1') {
    return COUNTRY_NAME_MAP[code] || code;
  }
  const tz = (timezone || '').trim();
  if (!tz) return 'Local / Unspecified';
  if (tz.includes('Kampala')) return 'Uganda (Approx. TZ)';
  if (tz.includes('Nairobi')) return 'Kenya / East Africa (Approx. TZ)';
  if (tz.includes('Kigali')) return 'Rwanda (Approx. TZ)';
  if (tz.includes('Dar_es_Salaam')) return 'Tanzania (Approx. TZ)';
  if (tz.startsWith('Africa/')) return `Africa · ${tz.split('/')[1]?.replace(/_/g, ' ') || 'Region'}`;
  if (tz.startsWith('Europe/')) return `Europe · ${tz.split('/')[1]?.replace(/_/g, ' ') || 'Region'}`;
  if (tz.startsWith('America/')) return `Americas · ${tz.split('/')[1]?.replace(/_/g, ' ') || 'Region'}`;
  if (tz.startsWith('Asia/')) return `Asia · ${tz.split('/')[1]?.replace(/_/g, ' ') || 'Region'}`;
  return 'Other Region (Approx.)';
}

export function computeDeltaPct(current: number, previous: number): number | null {
  if (previous <= 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function formatTimeBucket(isoTimestamp: string, granularity: AnalyticsGranularity): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp.slice(0, 10);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');

  if (granularity === 'monthly') {
    return `${y}-${m}`;
  }
  if (granularity === 'weekly') {
    const day = date.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(Date.UTC(y, date.getUTCMonth(), date.getUTCDate() + diffToMonday));
    const wy = monday.getUTCFullYear();
    const wm = String(monday.getUTCMonth() + 1).padStart(2, '0');
    const wd = String(monday.getUTCDate()).padStart(2, '0');
    return `${wy}-${wm}-${wd}`;
  }
  return `${y}-${m}-${d}`;
}

export function computeDateComparisonWindow(startIso: string, endIso: string): {
  startMs: number;
  endMs: number;
  prevStartMs: number;
  prevEndMs: number;
} {
  const startDate = new Date(`${startIso}T00:00:00.000Z`);
  const endDate = new Date(`${endIso}T23:59:59.999Z`);
  const startMs = Number.isNaN(startDate.getTime()) ? Date.now() - 30 * 86400000 : startDate.getTime();
  const endMs = Number.isNaN(endDate.getTime()) ? Date.now() : endDate.getTime();
  const span = Math.max(86400000, endMs - startMs + 1);
  const prevEndMs = startMs - 1;
  const prevStartMs = prevEndMs - span + 1;
  return { startMs, endMs, prevStartMs, prevEndMs };
}
