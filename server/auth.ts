import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import type Database from 'better-sqlite3';

export const ADMIN_COOKIE_NAME = 'cn_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface RateRecord {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateRecord>();

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash: derived, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(storedHash, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function timingSafeTextEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const current = loginAttempts.get(ip);
  if (!current || current.resetAt <= now) {
    return true;
  }
  return current.count < 12;
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const current = loginAttempts.get(ip);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
  } else {
    current.count += 1;
  }
}

export function clearLoginFailures(ip: string): void {
  loginAttempts.delete(ip);
}

export function getEnvAdminCredentials(): {
  active: boolean;
  email: string;
  password: string;
} {
  const password = (process.env.ADMIN_PASSWORD || '').trim();
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase() || 'admin@cybernestug.com';
  return {
    active: password.length > 0,
    email,
    password,
  };
}

export function isAdminInitialized(db: Database.Database): boolean {
  const envCreds = getEnvAdminCredentials();
  if (envCreds.active) return true;
  const row = db.prepare('SELECT COUNT(*) as cnt FROM admin_users').get() as { cnt: number };
  return row.cnt > 0;
}

export function createSessionForAdmin(db: Database.Database, adminEmail: string): string {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(rawToken);
  const id = crypto.randomUUID();
  const nowIso = new Date().toISOString();
  const expiresIso = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  db.prepare(
    `INSERT INTO admin_sessions (id, token_hash, admin_email, created_at, expires_at, revoked)
     VALUES (?, ?, ?, ?, ?, 0)`,
  ).run(id, tokenHash, adminEmail, nowIso, expiresIso);

  return rawToken;
}

export function setSessionCookie(req: Request, res: Response, rawToken: string): void {
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    (req.headers.origin || '').startsWith('https://');

  if (isHttps) {
    res.setHeader(
      'Set-Cookie',
      `${ADMIN_COOKIE_NAME}=${encodeURIComponent(rawToken)}; Path=/; Max-Age=${Math.floor(
        SESSION_TTL_MS / 1000,
      )}; HttpOnly; Secure; SameSite=None; Partitioned`,
    );
  } else {
    res.cookie(ADMIN_COOKIE_NAME, rawToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_MS,
    });
  }
}

export function clearSessionCookie(req: Request, res: Response): void {
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    (req.headers.origin || '').startsWith('https://');

  if (isHttps) {
    res.setHeader(
      'Set-Cookie',
      `${ADMIN_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned`,
    );
  } else {
    res.clearCookie(ADMIN_COOKIE_NAME, { path: '/' });
  }
}

export function verifyRequestOrigin(req: Request): boolean {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return true;
  }
  const hasCustomHeader = req.headers['x-requested-with'] === 'CyberNest-Admin';
  const origin = req.headers.origin;
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host && hasCustomHeader) {
        return true;
      }
      if (originHost === host) return true;
      return false;
    } catch {
      return false;
    }
  }
  return hasCustomHeader;
}

export function getAuthenticatedSession(
  db: Database.Database,
  req: Request,
): { adminEmail: string; tokenHash: string } | null {
  const cookieToken = req.cookies?.[ADMIN_COOKIE_NAME];
  const bearerHeader = req.headers.authorization;
  const rawToken =
    typeof cookieToken === 'string' && cookieToken.length > 0
      ? cookieToken
      : typeof bearerHeader === 'string' && bearerHeader.startsWith('Bearer ')
        ? bearerHeader.slice(7).trim()
        : '';

  if (!rawToken) return null;
  const tokenHash = hashSessionToken(rawToken);
  const nowIso = new Date().toISOString();

  const row = db
    .prepare(
      `SELECT admin_email, expires_at FROM admin_sessions
       WHERE token_hash = ? AND revoked = 0 AND expires_at > ?`,
    )
    .get(tokenHash, nowIso) as { admin_email: string; expires_at: string } | undefined;

  if (!row) return null;
  return { adminEmail: row.admin_email, tokenHash };
}

export function createRequireAdminMiddleware(db: Database.Database) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!verifyRequestOrigin(req)) {
      res.status(403).json({ error: 'Invalid request origin.' });
      return;
    }
    const session = getAuthenticatedSession(db, req);
    if (!session) {
      res.status(401).json({ error: 'Administrator authentication required.' });
      return;
    }
    (req as Request & { adminEmail?: string; sessionHash?: string }).adminEmail =
      session.adminEmail;
    (req as Request & { adminEmail?: string; sessionHash?: string }).sessionHash =
      session.tokenHash;
    next();
  };
}

export function verifyAdminCredentials(
  db: Database.Database,
  emailInput: string,
  passwordInput: string,
): { ok: boolean; adminEmail: string | null } {
  const normalizedEmail = emailInput.trim().toLowerCase();
  const envCreds = getEnvAdminCredentials();

  if (envCreds.active) {
    const emailMatches =
      !process.env.ADMIN_EMAIL || timingSafeTextEqual(normalizedEmail, envCreds.email);
    const passMatches = timingSafeTextEqual(passwordInput, envCreds.password);
    return {
      ok: emailMatches && passMatches,
      adminEmail: emailMatches && passMatches ? normalizedEmail || envCreds.email : null,
    };
  }

  const user = db
    .prepare('SELECT email, password_hash, password_salt FROM admin_users WHERE lower(email) = ?')
    .get(normalizedEmail) as
    | { email: string; password_hash: string; password_salt: string }
    | undefined;

  if (!user) return { ok: false, adminEmail: null };
  const valid = verifyPassword(passwordInput, user.password_hash, user.password_salt);
  return { ok: valid, adminEmail: valid ? user.email : null };
}
