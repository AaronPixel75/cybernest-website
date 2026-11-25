import crypto from 'node:crypto';
import { Router } from 'express';
import type Database from 'better-sqlite3';
import { z } from 'zod';
import { loadSiteContent } from '../db.ts';
import { extractClientIp, ingestAnalyticsEvent } from '../analytics.ts';
import type { AnalyticsEventType } from '../../src/types/cms.ts';

const analyticsEventSchema = z.object({
  sessionId: z.string().min(8).max(120),
  eventType: z.enum([
    'pageview',
    'heartbeat',
    'button_click',
    'team_interact',
    'product_view',
    'contact_click',
    'contact_submit',
  ]),
  label: z.string().max(200).optional(),
  pagePath: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  timezone: z.string().max(100).optional(),
  durationSec: z.number().min(0).max(86400).optional(),
});

const contactSubmitSchema = z.object({
  enquiryType: z.enum(['project', 'partnership', 'academy']),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  organization: z.string().trim().max(160).optional().default(''),
  message: z.string().trim().min(12).max(4000),
  websiteHp: z.string().optional().default(''),
  formOpenedAtMs: z.number().optional(),
  sessionId: z.string().max(120).optional(),
});

const contactRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkContactRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = contactRateLimitMap.get(ip);
  if (!entry || entry.resetAt <= now) {
    contactRateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 8) return false;
  entry.count += 1;
  return true;
}

export function createPublicRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/site', (_req, res) => {
    const content = loadSiteContent(db, true);
    res.json(content);
  });

  router.post('/analytics/event', (req, res) => {
    const parsed = analyticsEventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid analytics payload.' });
      return;
    }

    const dnt = req.headers['dnt'];
    if (dnt === '1') {
      res.status(204).end();
      return;
    }

    ingestAnalyticsEvent(db, req, {
      sessionId: parsed.data.sessionId,
      eventType: parsed.data.eventType as AnalyticsEventType,
      label: parsed.data.label,
      pagePath: parsed.data.pagePath,
      referrer: parsed.data.referrer,
      timezone: parsed.data.timezone,
      durationSec: parsed.data.durationSec,
    });
    res.status(202).json({ ok: true });
  });

  router.post('/contact', (req, res) => {
    const site = loadSiteContent(db, true);
    if (!site.contact.formEnabled) {
      res.status(403).json({ error: 'Contact form submissions are currently paused.' });
      return;
    }

    const ip = extractClientIp(req);
    if (!checkContactRateLimit(ip)) {
      res.status(429).json({
        error: 'Too many enquiries sent recently. Please try again in a few minutes.',
      });
      return;
    }

    const parsed = contactSubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Please check your name, email address, and message details.',
      });
      return;
    }

    const data = parsed.data;
    // Basic spam protection: honeypot field must stay empty
    if (data.websiteHp.trim().length > 0) {
      res.status(201).json({ ok: true, id: 'accepted' });
      return;
    }

    // Timing check: reject automated instant submissions under 800ms
    if (
      typeof data.formOpenedAtMs === 'number' &&
      Date.now() - data.formOpenedAtMs < 800
    ) {
      res.status(400).json({ error: 'Please wait a moment before submitting the form.' });
      return;
    }

    const id = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    db.prepare(
      `INSERT INTO contact_submissions
       (id, enquiry_type, full_name, email, organization, message, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    ).run(
      id,
      data.enquiryType,
      data.fullName,
      data.email,
      data.organization,
      data.message,
      nowIso,
      nowIso,
    );

    if (data.sessionId && data.sessionId.length >= 8) {
      ingestAnalyticsEvent(db, req, {
        sessionId: data.sessionId,
        eventType: 'contact_submit',
        label: `Form: ${data.enquiryType}`,
        pagePath: '/',
      });
    }

    res.status(201).json({
      ok: true,
      id,
      message: site.contact.formSuccessMessage,
    });
  });

  return router;
}
