import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import type { Request } from 'express';
import type Database from 'better-sqlite3';
import multer from 'multer';
import { z } from 'zod';
import {
  BACKUPS_DIR,
  UPLOADS_DIR,
  loadSiteContent,
} from '../db.ts';
import {
  checkLoginRateLimit,
  clearLoginFailures,
  clearSessionCookie,
  createRequireAdminMiddleware,
  createSessionForAdmin,
  getAuthenticatedSession,
  getEnvAdminCredentials,
  hashPassword,
  isAdminInitialized,
  recordLoginFailure,
  setSessionCookie,
  verifyAdminCredentials,
  verifyPassword,
  verifyRequestOrigin,
} from '../auth.ts';
import { extractClientIp, queryAnalyticsOverview } from '../analytics.ts';
import type { AnalyticsGranularity } from '../../src/types/cms.ts';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function detectSafeImageExt(buffer: Buffer, mimeType: string): { ext: string; mime: string } | null {
  if (buffer.length < 4) return null;
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { ext: '.png', mime: 'image/png' };
  }
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: '.jpg', mime: 'image/jpeg' };
  }
  // WEBP (RIFF....WEBP)
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { ext: '.webp', mime: 'image/webp' };
  }
  // ICO
  if (
    buffer[0] === 0x00 &&
    buffer[1] === 0x00 &&
    buffer[2] === 0x01 &&
    buffer[3] === 0x00
  ) {
    return { ext: '.ico', mime: 'image/x-icon' };
  }
  // SVG (validated safe XML without script tags or event handlers)
  if (mimeType === 'image/svg+xml') {
    const text = buffer.toString('utf8');
    if (
      text.includes('<svg') &&
      !/<script/i.test(text) &&
      !/\son\w+\s*=/i.test(text) &&
      !/javascript:/i.test(text)
    ) {
      return { ext: '.svg', mime: 'image/svg+xml' };
    }
  }
  return null;
}

function escapeCsvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

const claimSchema = z.object({
  email: z.string().trim().email().max(180),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().min(2).max(180),
  password: z.string().min(1).max(128),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

const teamSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  slotIndex: z.string().trim().min(1).max(10),
  name: z.string().trim().min(1).max(140),
  roleTitle: z.string().trim().min(1).max(160),
  discipline: z.string().trim().min(1).max(100),
  bio: z.string().trim().min(1).max(1000),
  accentHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  photoUrl: z.string().trim().max(500).default(''),
  socialLinks: z
    .object({
      website: z.string().trim().max(300).optional(),
      linkedin: z.string().trim().max(300).optional(),
      github: z.string().trim().max(300).optional(),
      x: z.string().trim().max(300).optional(),
      instagram: z.string().trim().max(300).optional(),
    })
    .default({}),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isPublished: z.boolean().default(true),
});

const productSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(140),
  tagline: z.string().trim().min(1).max(400),
  summary: z.string().trim().min(1).max(1200),
  problemSolved: z.string().trim().min(1).max(600),
  features: z.array(z.string().trim().min(1).max(240)).min(1).max(12),
  accentHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  imagePath: z.string().trim().max(500).default(''),
  externalUrl: z.string().trim().max(300).default(''),
  isFlagship: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  architectureNote: z.string().trim().max(500).default(''),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

const programSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(140),
  purpose: z.string().trim().min(1).max(400),
  problemSolved: z.string().trim().min(1).max(400),
  features: z.array(z.string().trim().min(1).max(200)).min(1).max(8),
  accentHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

const courseSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  title: z.string().trim().min(1).max(120),
  audience: z.string().trim().min(1).max(160),
  focus: z.string().trim().min(1).max(600),
  projectOutcome: z.string().trim().min(1).max(300),
  imagePath: z.string().trim().max(500).default(''),
  enrollUrl: z.string().trim().max(300).default('#contact'),
  accentHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

const socialSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  platform: z.enum([
    'Facebook',
    'Instagram',
    'LinkedIn',
    'TikTok',
    'X',
    'YouTube',
    'GitHub',
    'Other',
  ]),
  label: z.string().trim().min(1).max(80),
  url: z.string().trim().url().max(300),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isPublished: z.boolean().default(true),
});

const projectSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(2).max(180),
  category: z.enum([
    'Software and Applications',
    'Artificial Intelligence',
    'Education Technology',
    'Robotics and Innovation',
    'Other Technology Projects',
  ]),
  summary: z.string().trim().min(5).max(500),
  overview: z.string().trim().min(5).max(2000),
  problemSolved: z.string().trim().min(5).max(1200),
  ourSolution: z.string().trim().min(5).max(1500),
  features: z.array(z.string().trim().min(1).max(240)).min(1).max(12),
  technologies: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  thumbnailUrl: z.string().trim().max(500).default(''),
  screenshots: z.array(z.string().trim().max(500)).max(12).default([]),
  outcomes: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
  relatedProductId: z.string().trim().max(80).default(''),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

const testimonialSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  category: z.enum(['voxlan', 'student']),
  categoryLabel: z.string().trim().min(1).max(100),
  quote: z.string().trim().min(10).max(800),
  authorName: z.string().trim().min(2).max(120),
  authorRole: z.string().trim().min(2).max(120),
  institutionOrTrack: z.string().trim().min(2).max(160),
  outcomeNote: z.string().trim().min(2).max(200),
  photoUrl: z.string().trim().max(500).default(''),
  logoUrl: z.string().trim().max(500).default(''),
  relatedProjectId: z.string().trim().max(80).default(''),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1).max(80)).min(1),
});

export function createAdminRouter(db: Database.Database): Router {
  const router = Router();
  const requireAdmin = createRequireAdminMiddleware(db);

  // --- Auth Endpoints ---
  router.get('/auth/status', (req, res) => {
    const initialized = isAdminInitialized(db);
    const envOverrideActive = getEnvAdminCredentials().active;
    const session = getAuthenticatedSession(db, req);
    res.json({
      initialized,
      envOverrideActive,
      authenticated: Boolean(session),
      adminEmail: session?.adminEmail || null,
    });
  });

  router.post('/auth/claim', (req, res) => {
    if (!verifyRequestOrigin(req)) {
      res.status(403).json({ error: 'Invalid request origin.' });
      return;
    }
    const envCreds = getEnvAdminCredentials();
    if (envCreds.active) {
      res.status(409).json({
        error: 'Environment administrator credentials are already configured.',
      });
      return;
    }

    const existingCount = (
      db.prepare('SELECT COUNT(*) as cnt FROM admin_users').get() as { cnt: number }
    ).cnt;
    if (existingCount > 0) {
      res.status(409).json({ error: 'Administrator account already exists.' });
      return;
    }

    const parsed = claimSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Provide a valid email and a password with at least 8 characters.',
      });
      return;
    }

    const email = parsed.data.email.toLowerCase();
    const { hash, salt } = hashPassword(parsed.data.password);
    const nowIso = new Date().toISOString();

    const insertTx = db.transaction(() => {
      const cnt = (
        db.prepare('SELECT COUNT(*) as cnt FROM admin_users').get() as { cnt: number }
      ).cnt;
      if (cnt > 0) throw new Error('ALREADY_CLAIMED');
      db.prepare(
        `INSERT INTO admin_users (id, email, password_hash, password_salt, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(crypto.randomUUID(), email, hash, salt, nowIso, nowIso);
    });

    try {
      insertTx();
    } catch {
      res.status(409).json({ error: 'Administrator account already claimed.' });
      return;
    }

    const rawToken = createSessionForAdmin(db, email);
    setSessionCookie(req, res, rawToken);
    res.status(201).json({
      authenticated: true,
      adminEmail: email,
    });
  });

  router.post('/auth/login', (req, res) => {
    if (!verifyRequestOrigin(req)) {
      res.status(403).json({ error: 'Invalid request origin.' });
      return;
    }

    const ip = extractClientIp(req);
    if (!checkLoginRateLimit(ip)) {
      res.status(429).json({
        error: 'Too many failed sign-in attempts. Wait 15 minutes before retrying.',
      });
      return;
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const result = verifyAdminCredentials(db, parsed.data.email, parsed.data.password);
    if (!result.ok || !result.adminEmail) {
      recordLoginFailure(ip);
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    clearLoginFailures(ip);
    const rawToken = createSessionForAdmin(db, result.adminEmail);
    setSessionCookie(req, res, rawToken);
    res.json({
      authenticated: true,
      adminEmail: result.adminEmail,
    });
  });

  router.post('/auth/logout', (req, res) => {
    if (!verifyRequestOrigin(req)) {
      res.status(403).json({ error: 'Invalid request origin.' });
      return;
    }
    const session = getAuthenticatedSession(db, req);
    if (session) {
      db.prepare('UPDATE admin_sessions SET revoked = 1 WHERE token_hash = ?').run(
        session.tokenHash,
      );
    }
    clearSessionCookie(req, res);
    res.json({ authenticated: false });
  });

  // All routes below require authenticated administrator session
  router.use(requireAdmin);

  router.post('/auth/change-password', (req, res) => {
    const envCreds = getEnvAdminCredentials();
    if (envCreds.active) {
      res.status(400).json({
        error:
          'Password is managed via server environment variables (ADMIN_PASSWORD). Update it in your Secrets configuration.',
      });
      return;
    }

    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Current password and a new password (min 8 characters) are required.',
      });
      return;
    }

    const adminEmail = (req as Request & { adminEmail?: string }).adminEmail || '';
    const user = db
      .prepare('SELECT id, password_hash, password_salt FROM admin_users WHERE lower(email) = ?')
      .get(adminEmail.toLowerCase()) as
      | { id: string; password_hash: string; password_salt: string }
      | undefined;

    if (
      !user ||
      !verifyPassword(parsed.data.currentPassword, user.password_hash, user.password_salt)
    ) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    const { hash, salt } = hashPassword(parsed.data.newPassword);
    db.prepare(
      'UPDATE admin_users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?',
    ).run(hash, salt, new Date().toISOString(), user.id);

    res.json({ ok: true });
  });

  // --- Full Admin CMS Hydration ---
  router.get('/site', (_req, res) => {
    res.json(loadSiteContent(db, false));
  });

  // --- Analytics ---
  router.get('/analytics', (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const defaultStart = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    const start =
      typeof req.query.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.start)
        ? req.query.start
        : defaultStart;
    const end =
      typeof req.query.end === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.end)
        ? req.query.end
        : today;
    const granularityRaw = req.query.granularity;
    const granularity: AnalyticsGranularity =
      granularityRaw === 'weekly' || granularityRaw === 'monthly' ? granularityRaw : 'daily';

    res.json(queryAnalyticsOverview(db, start, end, granularity));
  });

  // --- Settings (homepage, about, contact, seo) ---
  router.put('/settings/:key', (req, res) => {
    const key = req.params.key;
    if (!['homepage', 'about', 'contact', 'seo'].includes(key)) {
      res.status(400).json({ error: 'Unknown settings section.' });
      return;
    }
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Invalid settings payload.' });
      return;
    }
    const nowIso = new Date().toISOString();
    db.prepare(
      `INSERT INTO site_settings (key, value_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
    ).run(key, JSON.stringify(req.body), nowIso);

    res.json({ ok: true, site: loadSiteContent(db, false) });
  });

  // --- Team Members CRUD & Reorder ---
  router.post('/team', (req, res) => {
    const parsed = teamSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid team member fields.' });
      return;
    }
    const m = parsed.data;
    const id = m.id || `member-${crypto.randomUUID().slice(0, 8)}`;
    const maxRow = db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM team_members')
      .get() as { m: number };
    const sortOrder = m.sortOrder || maxRow.m + 1;
    const nowIso = new Date().toISOString();

    db.prepare(
      `INSERT INTO team_members
       (id, slot_index, name, role_title, discipline, bio, accent_hex, photo_url, social_links_json, sort_order, is_published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      m.slotIndex,
      m.name,
      m.roleTitle,
      m.discipline,
      m.bio,
      m.accentHex,
      m.photoUrl,
      JSON.stringify(m.socialLinks),
      sortOrder,
      m.isPublished ? 1 : 0,
      nowIso,
    );

    res.status(201).json({ ok: true, id, teamMembers: loadSiteContent(db, false).teamMembers });
  });

  router.put('/team/:id', (req, res) => {
    const parsed = teamSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid team member fields.' });
      return;
    }
    const m = parsed.data;
    const result = db
      .prepare(
        `UPDATE team_members
         SET slot_index = ?, name = ?, role_title = ?, discipline = ?, bio = ?,
             accent_hex = ?, photo_url = ?, social_links_json = ?, is_published = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        m.slotIndex,
        m.name,
        m.roleTitle,
        m.discipline,
        m.bio,
        m.accentHex,
        m.photoUrl,
        JSON.stringify(m.socialLinks),
        m.isPublished ? 1 : 0,
        new Date().toISOString(),
        req.params.id,
      );

    if (result.changes === 0) {
      res.status(404).json({ error: 'Team member not found.' });
      return;
    }
    res.json({ ok: true, teamMembers: loadSiteContent(db, false).teamMembers });
  });

  router.post('/team/reorder', (req, res) => {
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid reorder list.' });
      return;
    }
    const updateStmt = db.prepare(
      'UPDATE team_members SET sort_order = ?, slot_index = ? WHERE id = ?',
    );
    db.transaction(() => {
      parsed.data.orderedIds.forEach((id, idx) => {
        updateStmt.run(idx, String(idx + 1).padStart(2, '0'), id);
      });
    })();
    res.json({ ok: true, teamMembers: loadSiteContent(db, false).teamMembers });
  });

  router.delete('/team/:id', (req, res) => {
    db.prepare('DELETE FROM team_members WHERE id = ?').run(req.params.id);
    res.json({ ok: true, teamMembers: loadSiteContent(db, false).teamMembers });
  });

  // --- Products CRUD & Reorder ---
  router.post('/products', (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid product fields.' });
      return;
    }
    const p = parsed.data;
    const id = p.id || `prod-${crypto.randomUUID().slice(0, 8)}`;
    const maxRow = db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM products')
      .get() as { m: number };
    const nowIso = new Date().toISOString();

    db.prepare(
      `INSERT INTO products
       (id, name, category, tagline, summary, problem_solved, features_json, accent_hex, image_path, external_url, is_flagship, is_published, architecture_note, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      p.name,
      p.category,
      p.tagline,
      p.summary,
      p.problemSolved,
      JSON.stringify(p.features),
      p.accentHex,
      p.imagePath,
      p.externalUrl,
      p.isFlagship ? 1 : 0,
      p.isPublished ? 1 : 0,
      p.architectureNote,
      maxRow.m + 1,
      nowIso,
    );

    res.status(201).json({ ok: true, id, products: loadSiteContent(db, false).products });
  });

  router.put('/products/:id', (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid product fields.' });
      return;
    }
    const p = parsed.data;
    const result = db
      .prepare(
        `UPDATE products
         SET name = ?, category = ?, tagline = ?, summary = ?, problem_solved = ?,
             features_json = ?, accent_hex = ?, image_path = ?, external_url = ?,
             is_flagship = ?, is_published = ?, architecture_note = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        p.name,
        p.category,
        p.tagline,
        p.summary,
        p.problemSolved,
        JSON.stringify(p.features),
        p.accentHex,
        p.imagePath,
        p.externalUrl,
        p.isFlagship ? 1 : 0,
        p.isPublished ? 1 : 0,
        p.architectureNote,
        new Date().toISOString(),
        req.params.id,
      );

    if (result.changes === 0) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json({ ok: true, products: loadSiteContent(db, false).products });
  });

  router.post('/products/reorder', (req, res) => {
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid reorder list.' });
      return;
    }
    const stmt = db.prepare('UPDATE products SET sort_order = ? WHERE id = ?');
    db.transaction(() => {
      parsed.data.orderedIds.forEach((id, idx) => stmt.run(idx, id));
    })();
    res.json({ ok: true, products: loadSiteContent(db, false).products });
  });

  router.delete('/products/:id', (req, res) => {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ ok: true, products: loadSiteContent(db, false).products });
  });

  // --- Software Programs CRUD ---
  router.post('/programs', (req, res) => {
    const parsed = programSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid software program fields.' });
      return;
    }
    const prog = parsed.data;
    const id = prog.id || `prog-${crypto.randomUUID().slice(0, 8)}`;
    const maxRow = db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM software_programs')
      .get() as { m: number };
    db.prepare(
      `INSERT INTO software_programs
       (id, name, category, purpose, problem_solved, features_json, accent_hex, is_published, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      prog.name,
      prog.category,
      prog.purpose,
      prog.problemSolved,
      JSON.stringify(prog.features),
      prog.accentHex,
      prog.isPublished ? 1 : 0,
      maxRow.m + 1,
      new Date().toISOString(),
    );
    res.status(201).json({ ok: true, softwarePrograms: loadSiteContent(db, false).softwarePrograms });
  });

  router.put('/programs/:id', (req, res) => {
    const parsed = programSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid software program fields.' });
      return;
    }
    const prog = parsed.data;
    db.prepare(
      `UPDATE software_programs
       SET name = ?, category = ?, purpose = ?, problem_solved = ?, features_json = ?, accent_hex = ?, is_published = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      prog.name,
      prog.category,
      prog.purpose,
      prog.problemSolved,
      JSON.stringify(prog.features),
      prog.accentHex,
      prog.isPublished ? 1 : 0,
      new Date().toISOString(),
      req.params.id,
    );
    res.json({ ok: true, softwarePrograms: loadSiteContent(db, false).softwarePrograms });
  });

  router.delete('/programs/:id', (req, res) => {
    db.prepare('DELETE FROM software_programs WHERE id = ?').run(req.params.id);
    res.json({ ok: true, softwarePrograms: loadSiteContent(db, false).softwarePrograms });
  });

  // --- Courses CRUD & Reorder ---
  router.post('/courses', (req, res) => {
    const parsed = courseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid course fields.' });
      return;
    }
    const c = parsed.data;
    const id = c.id || `course-${crypto.randomUUID().slice(0, 8)}`;
    const maxRow = db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM courses')
      .get() as { m: number };
    db.prepare(
      `INSERT INTO courses
       (id, title, audience, focus, project_outcome, image_path, enroll_url, accent_hex, is_published, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      c.title,
      c.audience,
      c.focus,
      c.projectOutcome,
      c.imagePath,
      c.enrollUrl,
      c.accentHex,
      c.isPublished ? 1 : 0,
      maxRow.m + 1,
      new Date().toISOString(),
    );
    res.status(201).json({ ok: true, id, courses: loadSiteContent(db, false).courses });
  });

  router.put('/courses/:id', (req, res) => {
    const parsed = courseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid course fields.' });
      return;
    }
    const c = parsed.data;
    const result = db
      .prepare(
        `UPDATE courses
         SET title = ?, audience = ?, focus = ?, project_outcome = ?, image_path = ?,
             enroll_url = ?, accent_hex = ?, is_published = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        c.title,
        c.audience,
        c.focus,
        c.projectOutcome,
        c.imagePath,
        c.enrollUrl,
        c.accentHex,
        c.isPublished ? 1 : 0,
        new Date().toISOString(),
        req.params.id,
      );
    if (result.changes === 0) {
      res.status(404).json({ error: 'Course not found.' });
      return;
    }
    res.json({ ok: true, courses: loadSiteContent(db, false).courses });
  });

  router.post('/courses/reorder', (req, res) => {
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid reorder list.' });
      return;
    }
    const stmt = db.prepare('UPDATE courses SET sort_order = ? WHERE id = ?');
    db.transaction(() => {
      parsed.data.orderedIds.forEach((id, idx) => stmt.run(idx, id));
    })();
    res.json({ ok: true, courses: loadSiteContent(db, false).courses });
  });

  router.delete('/courses/:id', (req, res) => {
    db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
    res.json({ ok: true, courses: loadSiteContent(db, false).courses });
  });

  // --- Social Links CRUD & Reorder ---
  router.post('/socials', (req, res) => {
    const parsed = socialSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Provide a valid social platform, label, and URL.' });
      return;
    }
    const s = parsed.data;
    const id = s.id || `soc-${crypto.randomUUID().slice(0, 8)}`;
    const maxRow = db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM social_links')
      .get() as { m: number };
    db.prepare(
      `INSERT INTO social_links (id, platform, label, url, sort_order, is_published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, s.platform, s.label, s.url, maxRow.m + 1, s.isPublished ? 1 : 0, new Date().toISOString());
    res.status(201).json({ ok: true, socialLinks: loadSiteContent(db, false).socialLinks });
  });

  router.put('/socials/:id', (req, res) => {
    const parsed = socialSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Provide a valid social platform, label, and URL.' });
      return;
    }
    const s = parsed.data;
    db.prepare(
      `UPDATE social_links SET platform = ?, label = ?, url = ?, is_published = ?, updated_at = ?
       WHERE id = ?`,
    ).run(s.platform, s.label, s.url, s.isPublished ? 1 : 0, new Date().toISOString(), req.params.id);
    res.json({ ok: true, socialLinks: loadSiteContent(db, false).socialLinks });
  });

  router.post('/socials/reorder', (req, res) => {
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid reorder list.' });
      return;
    }
    const stmt = db.prepare('UPDATE social_links SET sort_order = ? WHERE id = ?');
    db.transaction(() => {
      parsed.data.orderedIds.forEach((id, idx) => stmt.run(idx, id));
    })();
    res.json({ ok: true, socialLinks: loadSiteContent(db, false).socialLinks });
  });

  router.delete('/socials/:id', (req, res) => {
    db.prepare('DELETE FROM social_links WHERE id = ?').run(req.params.id);
    res.json({ ok: true, socialLinks: loadSiteContent(db, false).socialLinks });
  });

  // --- Projects Showcase CRUD & Reorder ---
  router.post('/projects', (req, res) => {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid project fields. Ensure slug uses lowercase letters, numbers, and hyphens.' });
      return;
    }
    const pr = parsed.data;
    const id = pr.id || `proj-${crypto.randomUUID().slice(0, 8)}`;
    const dupSlug = db.prepare('SELECT id FROM projects WHERE slug = ? AND id != ?').get(pr.slug, id);
    if (dupSlug) {
      res.status(409).json({ error: 'Another project already uses that URL slug.' });
      return;
    }
    const maxRow = db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM projects')
      .get() as { m: number };
    db.prepare(
      `INSERT INTO projects
       (id, slug, title, category, summary, overview, problem_solved, our_solution, features_json, technologies_json, thumbnail_url, screenshots_json, outcomes_json, related_product_id, is_featured, is_published, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      pr.slug,
      pr.title,
      pr.category,
      pr.summary,
      pr.overview,
      pr.problemSolved,
      pr.ourSolution,
      JSON.stringify(pr.features),
      JSON.stringify(pr.technologies),
      pr.thumbnailUrl,
      JSON.stringify(pr.screenshots),
      JSON.stringify(pr.outcomes),
      pr.relatedProductId,
      pr.isFeatured ? 1 : 0,
      pr.isPublished ? 1 : 0,
      maxRow.m + 1,
      new Date().toISOString(),
    );
    res.status(201).json({ ok: true, id, projects: loadSiteContent(db, false).projects });
  });

  router.put('/projects/:id', (req, res) => {
    const parsed = projectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid project fields. Ensure slug uses lowercase letters, numbers, and hyphens.' });
      return;
    }
    const pr = parsed.data;
    const dupSlug = db
      .prepare('SELECT id FROM projects WHERE slug = ? AND id != ?')
      .get(pr.slug, req.params.id);
    if (dupSlug) {
      res.status(409).json({ error: 'Another project already uses that URL slug.' });
      return;
    }
    const result = db
      .prepare(
        `UPDATE projects
         SET slug = ?, title = ?, category = ?, summary = ?, overview = ?, problem_solved = ?, our_solution = ?,
             features_json = ?, technologies_json = ?, thumbnail_url = ?, screenshots_json = ?, outcomes_json = ?,
             related_product_id = ?, is_featured = ?, is_published = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        pr.slug,
        pr.title,
        pr.category,
        pr.summary,
        pr.overview,
        pr.problemSolved,
        pr.ourSolution,
        JSON.stringify(pr.features),
        JSON.stringify(pr.technologies),
        pr.thumbnailUrl,
        JSON.stringify(pr.screenshots),
        JSON.stringify(pr.outcomes),
        pr.relatedProductId,
        pr.isFeatured ? 1 : 0,
        pr.isPublished ? 1 : 0,
        new Date().toISOString(),
        req.params.id,
      );
    if (result.changes === 0) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    res.json({ ok: true, projects: loadSiteContent(db, false).projects });
  });

  router.post('/projects/reorder', (req, res) => {
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid reorder list.' });
      return;
    }
    const stmt = db.prepare('UPDATE projects SET sort_order = ? WHERE id = ?');
    db.transaction(() => {
      parsed.data.orderedIds.forEach((id, idx) => stmt.run(idx, id));
    })();
    res.json({ ok: true, projects: loadSiteContent(db, false).projects });
  });

  router.delete('/projects/:id', (req, res) => {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.json({ ok: true, projects: loadSiteContent(db, false).projects });
  });

  // --- Testimonials CRUD & Reorder ---
  router.post('/testimonials', (req, res) => {
    const parsed = testimonialSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid testimonial fields.' });
      return;
    }
    const t = parsed.data;
    const id = t.id || `test-${crypto.randomUUID().slice(0, 8)}`;
    const maxRow = db
      .prepare('SELECT COALESCE(MAX(sort_order), -1) as m FROM testimonials')
      .get() as { m: number };
    db.prepare(
      `INSERT INTO testimonials
       (id, category, category_label, quote, author_name, author_role, institution_or_track, outcome_note, photo_url, logo_url, related_project_id, is_featured, is_published, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      t.category,
      t.categoryLabel,
      t.quote,
      t.authorName,
      t.authorRole,
      t.institutionOrTrack,
      t.outcomeNote,
      t.photoUrl,
      t.logoUrl,
      t.relatedProjectId,
      t.isFeatured ? 1 : 0,
      t.isPublished ? 1 : 0,
      maxRow.m + 1,
      new Date().toISOString(),
    );
    res.status(201).json({ ok: true, id, testimonials: loadSiteContent(db, false).testimonials });
  });

  router.put('/testimonials/:id', (req, res) => {
    const parsed = testimonialSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid testimonial fields.' });
      return;
    }
    const t = parsed.data;
    const result = db
      .prepare(
        `UPDATE testimonials
         SET category = ?, category_label = ?, quote = ?, author_name = ?, author_role = ?,
             institution_or_track = ?, outcome_note = ?, photo_url = ?, logo_url = ?,
             related_project_id = ?, is_featured = ?, is_published = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        t.category,
        t.categoryLabel,
        t.quote,
        t.authorName,
        t.authorRole,
        t.institutionOrTrack,
        t.outcomeNote,
        t.photoUrl,
        t.logoUrl,
        t.relatedProjectId,
        t.isFeatured ? 1 : 0,
        t.isPublished ? 1 : 0,
        new Date().toISOString(),
        req.params.id,
      );
    if (result.changes === 0) {
      res.status(404).json({ error: 'Testimonial not found.' });
      return;
    }
    res.json({ ok: true, testimonials: loadSiteContent(db, false).testimonials });
  });

  router.post('/testimonials/reorder', (req, res) => {
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid reorder list.' });
      return;
    }
    const stmt = db.prepare('UPDATE testimonials SET sort_order = ? WHERE id = ?');
    db.transaction(() => {
      parsed.data.orderedIds.forEach((id, idx) => stmt.run(idx, id));
    })();
    res.json({ ok: true, testimonials: loadSiteContent(db, false).testimonials });
  });

  router.delete('/testimonials/:id', (req, res) => {
    db.prepare('DELETE FROM testimonials WHERE id = ?').run(req.params.id);
    res.json({ ok: true, testimonials: loadSiteContent(db, false).testimonials });
  });

  // --- Enquiries Inbox ---
  router.get('/enquiries', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT id, enquiry_type, full_name, email, organization, message, status, created_at, updated_at
         FROM contact_submissions ORDER BY created_at DESC`,
      )
      .all() as Record<string, unknown>[];
    res.json({
      enquiries: rows.map((r) => ({
        id: String(r.id),
        enquiryType: String(r.enquiry_type),
        fullName: String(r.full_name),
        email: String(r.email),
        organization: String(r.organization || ''),
        message: String(r.message),
        status: String(r.status) as 'pending' | 'resolved',
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      })),
    });
  });

  router.patch('/enquiries/:id', (req, res) => {
    const status = req.body?.status;
    if (status !== 'pending' && status !== 'resolved') {
      res.status(400).json({ error: 'Status must be pending or resolved.' });
      return;
    }
    const result = db
      .prepare('UPDATE contact_submissions SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, new Date().toISOString(), req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Submission not found.' });
      return;
    }
    res.json({ ok: true });
  });

  router.delete('/enquiries/:id', (req, res) => {
    db.prepare('DELETE FROM contact_submissions WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  });

  router.get('/enquiries/export', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT id, enquiry_type, full_name, email, organization, message, status, created_at
         FROM contact_submissions ORDER BY created_at DESC`,
      )
      .all() as Record<string, unknown>[];

    const header = [
      'ID',
      'Enquiry Type',
      'Full Name',
      'Email',
      'Organization',
      'Message',
      'Status',
      'Submitted At',
    ].join(',');
    const lines = rows.map((r) =>
      [
        escapeCsvCell(String(r.id)),
        escapeCsvCell(String(r.enquiry_type)),
        escapeCsvCell(String(r.full_name)),
        escapeCsvCell(String(r.email)),
        escapeCsvCell(String(r.organization || '')),
        escapeCsvCell(String(r.message)),
        escapeCsvCell(String(r.status)),
        escapeCsvCell(String(r.created_at)),
      ].join(','),
    );
    const csv = [header, ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cybernest-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(csv);
  });

  // --- Media Uploads & Library ---
  router.get('/uploads', (_req, res) => {
    const rows = db
      .prepare('SELECT * FROM media_assets ORDER BY created_at DESC')
      .all() as Record<string, unknown>[];
    res.json({
      assets: rows.map((r) => ({
        id: String(r.id),
        filename: String(r.filename),
        originalName: String(r.original_name),
        mimeType: String(r.mime_type),
        byteSize: Number(r.byte_size),
        url: String(r.url),
        createdAt: String(r.created_at),
      })),
    });
  });

  router.post('/uploads', upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Select an image file to upload (max 5 MB).' });
      return;
    }

    const detected = detectSafeImageExt(file.buffer, file.mimetype);
    if (!detected) {
      res.status(400).json({
        error: 'Unsupported or unsafe file format. Allowed: PNG, JPG, WebP, ICO, clean SVG.',
      });
      return;
    }

    const id = crypto.randomUUID();
    const filename = `${id}${detected.ext}`;
    const targetPath = path.resolve(UPLOADS_DIR, filename);
    if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
      res.status(400).json({ error: 'Invalid upload path.' });
      return;
    }

    fs.writeFileSync(targetPath, file.buffer);
    const url = `/uploads/${filename}`;
    const nowIso = new Date().toISOString();

    db.prepare(
      `INSERT INTO media_assets (id, filename, original_name, mime_type, byte_size, url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, filename, file.originalname.slice(0, 160), detected.mime, file.size, url, nowIso);

    res.status(201).json({
      asset: {
        id,
        filename,
        originalName: file.originalname,
        mimeType: detected.mime,
        byteSize: file.size,
        url,
        createdAt: nowIso,
      },
    });
  });

  router.delete('/uploads/:id', (req, res) => {
    const row = db
      .prepare('SELECT filename FROM media_assets WHERE id = ?')
      .get(req.params.id) as { filename: string } | undefined;
    if (row) {
      const targetPath = path.resolve(UPLOADS_DIR, row.filename);
      if (targetPath.startsWith(UPLOADS_DIR + path.sep) && fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      db.prepare('DELETE FROM media_assets WHERE id = ?').run(req.params.id);
    }
    res.json({ ok: true });
  });

  // --- Database Backups & Recovery ---
  router.get('/backup/export', (_req, res) => {
    const content = loadSiteContent(db, false);
    const enquiries = db.prepare('SELECT * FROM contact_submissions').all();
    const mediaAssets = db.prepare('SELECT * FROM media_assets').all();
    const snapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      content,
      enquiries,
      mediaAssets,
    };

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cybernest-cms-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    res.send(JSON.stringify(snapshot, null, 2));
  });

  router.get('/backup/sqlite', async (_req, res) => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cybernest-db-${stamp}.db`;
    const backupFile = path.resolve(BACKUPS_DIR, filename);
    if (!backupFile.startsWith(BACKUPS_DIR + path.sep)) {
      res.status(400).json({ error: 'Invalid backup path.' });
      return;
    }

    await db.backup(backupFile);
    res.download(backupFile, filename);
  });

  router.post('/backup/restore', async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || !body.content) {
      res.status(400).json({ error: 'Invalid CyberNest backup snapshot.' });
      return;
    }

    const content = body.content;
    if (
      !content.homepage ||
      !content.about ||
      !content.contact ||
      !content.seo ||
      !Array.isArray(content.teamMembers) ||
      !Array.isArray(content.products) ||
      !Array.isArray(content.courses)
    ) {
      res.status(400).json({ error: 'Backup JSON is missing required CMS sections.' });
      return;
    }

    // Automatic pre-restore safety checkpoint
    const checkpointPath = path.resolve(
      BACKUPS_DIR,
      `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.db`,
    );
    await db.backup(checkpointPath);

    const nowIso = new Date().toISOString();
    const restoreTx = db.transaction(() => {
      const upsertSetting = db.prepare(
        `INSERT INTO site_settings (key, value_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
      );
      upsertSetting.run('homepage', JSON.stringify(content.homepage), nowIso);
      upsertSetting.run('about', JSON.stringify(content.about), nowIso);
      upsertSetting.run('contact', JSON.stringify(content.contact), nowIso);
      upsertSetting.run('seo', JSON.stringify(content.seo), nowIso);

      db.prepare('DELETE FROM team_members').run();
      const insertTeam = db.prepare(
        `INSERT INTO team_members
         (id, slot_index, name, role_title, discipline, bio, accent_hex, photo_url, social_links_json, sort_order, is_published, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      content.teamMembers.forEach((m: Record<string, unknown>, idx: number) => {
        insertTeam.run(
          String(m.id || `slot-${idx}`),
          String(m.slotIndex || String(idx + 1).padStart(2, '0')),
          String(m.name || ''),
          String(m.roleTitle || ''),
          String(m.discipline || ''),
          String(m.bio || ''),
          String(m.accentHex || '#4C138E'),
          String(m.photoUrl || ''),
          JSON.stringify(m.socialLinks || {}),
          Number(m.sortOrder ?? idx),
          m.isPublished === false ? 0 : 1,
          nowIso,
        );
      });

      db.prepare('DELETE FROM products').run();
      const insertProd = db.prepare(
        `INSERT INTO products
         (id, name, category, tagline, summary, problem_solved, features_json, accent_hex, image_path, external_url, is_flagship, is_published, architecture_note, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      content.products.forEach((p: Record<string, unknown>, idx: number) => {
        insertProd.run(
          String(p.id || `prod-${idx}`),
          String(p.name || ''),
          String(p.category || ''),
          String(p.tagline || ''),
          String(p.summary || ''),
          String(p.problemSolved || ''),
          JSON.stringify(Array.isArray(p.features) ? p.features : []),
          String(p.accentHex || '#4C138E'),
          String(p.imagePath || ''),
          String(p.externalUrl || ''),
          p.isFlagship ? 1 : 0,
          p.isPublished === false ? 0 : 1,
          String(p.architectureNote || ''),
          Number(p.sortOrder ?? idx),
          nowIso,
        );
      });

      if (Array.isArray(content.courses)) {
        db.prepare('DELETE FROM courses').run();
        const insertCourse = db.prepare(
          `INSERT INTO courses
           (id, title, audience, focus, project_outcome, image_path, enroll_url, accent_hex, is_published, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        content.courses.forEach((c: Record<string, unknown>, idx: number) => {
          insertCourse.run(
            String(c.id || `course-${idx}`),
            String(c.title || ''),
            String(c.audience || ''),
            String(c.focus || ''),
            String(c.projectOutcome || ''),
            String(c.imagePath || ''),
            String(c.enrollUrl || '#contact'),
            String(c.accentHex || '#4C138E'),
            c.isPublished === false ? 0 : 1,
            Number(c.sortOrder ?? idx),
            nowIso,
          );
        });
      }

      if (Array.isArray(content.socialLinks)) {
        db.prepare('DELETE FROM social_links').run();
        const insertSocial = db.prepare(
          `INSERT INTO social_links (id, platform, label, url, sort_order, is_published, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        );
        content.socialLinks.forEach((s: Record<string, unknown>, idx: number) => {
          insertSocial.run(
            String(s.id || `soc-${idx}`),
            String(s.platform || 'Other'),
            String(s.label || 'Link'),
            String(s.url || 'https://cybernestug.com'),
            Number(s.sortOrder ?? idx),
            s.isPublished === false ? 0 : 1,
            nowIso,
          );
        });
      }

      if (Array.isArray(content.projects)) {
        db.prepare('DELETE FROM projects').run();
        const insertProj = db.prepare(
          `INSERT INTO projects
           (id, slug, title, category, summary, overview, problem_solved, our_solution, features_json, technologies_json, thumbnail_url, screenshots_json, outcomes_json, related_product_id, is_featured, is_published, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        content.projects.forEach((pr: Record<string, unknown>, idx: number) => {
          insertProj.run(
            String(pr.id || `proj-${idx}`),
            String(pr.slug || pr.id || `proj-${idx}`),
            String(pr.title || ''),
            String(pr.category || 'Software and Applications'),
            String(pr.summary || ''),
            String(pr.overview || ''),
            String(pr.problemSolved || ''),
            String(pr.ourSolution || ''),
            JSON.stringify(Array.isArray(pr.features) ? pr.features : []),
            JSON.stringify(Array.isArray(pr.technologies) ? pr.technologies : []),
            String(pr.thumbnailUrl || ''),
            JSON.stringify(Array.isArray(pr.screenshots) ? pr.screenshots : []),
            JSON.stringify(Array.isArray(pr.outcomes) ? pr.outcomes : []),
            String(pr.relatedProductId || ''),
            pr.isFeatured ? 1 : 0,
            pr.isPublished === false ? 0 : 1,
            Number(pr.sortOrder ?? idx),
            nowIso,
          );
        });
      }

      if (Array.isArray(content.testimonials)) {
        db.prepare('DELETE FROM testimonials').run();
        const insertTest = db.prepare(
          `INSERT INTO testimonials
           (id, category, category_label, quote, author_name, author_role, institution_or_track, outcome_note, photo_url, logo_url, related_project_id, is_featured, is_published, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        content.testimonials.forEach((t: Record<string, unknown>, idx: number) => {
          insertTest.run(
            String(t.id || `test-${idx}`),
            t.category === 'student' ? 'student' : 'voxlan',
            String(t.categoryLabel || ''),
            String(t.quote || ''),
            String(t.authorName || ''),
            String(t.authorRole || ''),
            String(t.institutionOrTrack || ''),
            String(t.outcomeNote || ''),
            String(t.photoUrl || ''),
            String(t.logoUrl || ''),
            String(t.relatedProjectId || ''),
            t.isFeatured ? 1 : 0,
            t.isPublished === false ? 0 : 1,
            Number(t.sortOrder ?? idx),
            nowIso,
          );
        });
      }
    });

    restoreTx();
    res.json({ ok: true, site: loadSiteContent(db, false) });
  });

  return router;
}
