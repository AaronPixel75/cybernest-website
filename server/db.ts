import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { DEFAULT_SITE_CONTENT } from '../src/data/defaultSiteContent.ts';
import type {
  AboutSettings,
  ContactSettings,
  CourseItem,
  HomepageSettings,
  ProductItem,
  ProjectCategory,
  ProjectItem,
  SeoSettings,
  SiteContentPayload,
  SocialLinkItem,
  SoftwareProgramItem,
  TeamMember,
  TestimonialCmsItem,
} from '../src/types/cms.ts';

export const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
export const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');
export const DB_PATH = path.resolve(DATA_DIR, 'cybernest.db');

let dbInstance: Database.Database | null = null;

export function ensureDataDirectories(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export function getDatabase(): Database.Database {
  if (dbInstance) return dbInstance;
  ensureDataDirectories();
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  runMigrations(db);
  seedInitialContentIfEmpty(db);
  dbInstance = db;
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      token_hash TEXT NOT NULL UNIQUE,
      admin_email TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      slot_index TEXT NOT NULL,
      name TEXT NOT NULL,
      role_title TEXT NOT NULL,
      discipline TEXT NOT NULL,
      bio TEXT NOT NULL,
      accent_hex TEXT NOT NULL,
      photo_url TEXT NOT NULL DEFAULT '',
      social_links_json TEXT NOT NULL DEFAULT '{}',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      tagline TEXT NOT NULL,
      summary TEXT NOT NULL,
      problem_solved TEXT NOT NULL,
      features_json TEXT NOT NULL,
      accent_hex TEXT NOT NULL,
      image_path TEXT NOT NULL DEFAULT '',
      external_url TEXT NOT NULL DEFAULT '',
      is_flagship INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      architecture_note TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS software_programs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      purpose TEXT NOT NULL,
      problem_solved TEXT NOT NULL,
      features_json TEXT NOT NULL,
      accent_hex TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      audience TEXT NOT NULL,
      focus TEXT NOT NULL,
      project_outcome TEXT NOT NULL,
      image_path TEXT NOT NULL DEFAULT '',
      enroll_url TEXT NOT NULL DEFAULT '#contact',
      accent_hex TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      overview TEXT NOT NULL,
      problem_solved TEXT NOT NULL,
      our_solution TEXT NOT NULL,
      features_json TEXT NOT NULL DEFAULT '[]',
      technologies_json TEXT NOT NULL DEFAULT '[]',
      thumbnail_url TEXT NOT NULL DEFAULT '',
      screenshots_json TEXT NOT NULL DEFAULT '[]',
      outcomes_json TEXT NOT NULL DEFAULT '[]',
      related_product_id TEXT NOT NULL DEFAULT '',
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS social_links (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      category_label TEXT NOT NULL,
      quote TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_role TEXT NOT NULL,
      institution_or_track TEXT NOT NULL,
      outcome_note TEXT NOT NULL,
      photo_url TEXT NOT NULL DEFAULT '',
      logo_url TEXT NOT NULL DEFAULT '',
      related_project_id TEXT NOT NULL DEFAULT '',
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_submissions (
      id TEXT PRIMARY KEY,
      enquiry_type TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      organization TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      byte_size INTEGER NOT NULL,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analytics_salts (
      day_key TEXT PRIMARY KEY,
      salt_hex TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analytics_sessions (
      session_id TEXT PRIMARY KEY,
      visitor_hash TEXT NOT NULL,
      device TEXT NOT NULL,
      browser TEXT NOT NULL,
      os TEXT NOT NULL,
      region TEXT NOT NULL,
      referrer TEXT NOT NULL,
      entry_path TEXT NOT NULL,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      duration_sec INTEGER NOT NULL DEFAULT 0,
      pageview_count INTEGER NOT NULL DEFAULT 1,
      event_count INTEGER NOT NULL DEFAULT 1,
      is_bounce INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      visitor_hash TEXT NOT NULL,
      event_type TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      page_path TEXT NOT NULL DEFAULT '/',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_sessions_first_seen ON analytics_sessions(first_seen);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
  `);
}

function runMigrations(db: Database.Database): void {
  const cols = db.prepare('PRAGMA table_info(testimonials)').all() as { name: string }[];
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has('photo_url')) {
    db.exec("ALTER TABLE testimonials ADD COLUMN photo_url TEXT NOT NULL DEFAULT ''");
  }
  if (!colNames.has('logo_url')) {
    db.exec("ALTER TABLE testimonials ADD COLUMN logo_url TEXT NOT NULL DEFAULT ''");
  }
  if (!colNames.has('related_project_id')) {
    db.exec("ALTER TABLE testimonials ADD COLUMN related_project_id TEXT NOT NULL DEFAULT ''");
  }
  if (!colNames.has('is_featured')) {
    db.exec('ALTER TABLE testimonials ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0');
  }
}

function seedInitialContentIfEmpty(db: Database.Database): void {
  const now = new Date().toISOString();
  const settingsCount = (
    db.prepare('SELECT COUNT(*) as cnt FROM site_settings').get() as { cnt: number }
  ).cnt;

  if (settingsCount === 0) {
    const insertSetting = db.prepare(
      'INSERT INTO site_settings (key, value_json, updated_at) VALUES (?, ?, ?)',
    );
    insertSetting.run('homepage', JSON.stringify(DEFAULT_SITE_CONTENT.homepage), now);
    insertSetting.run('about', JSON.stringify(DEFAULT_SITE_CONTENT.about), now);
    insertSetting.run('contact', JSON.stringify(DEFAULT_SITE_CONTENT.contact), now);
    insertSetting.run('seo', JSON.stringify(DEFAULT_SITE_CONTENT.seo), now);
  }

  const teamCount = (
    db.prepare('SELECT COUNT(*) as cnt FROM team_members').get() as { cnt: number }
  ).cnt;
  if (teamCount === 0) {
    const stmt = db.prepare(
      `INSERT INTO team_members
       (id, slot_index, name, role_title, discipline, bio, accent_hex, photo_url, social_links_json, sort_order, is_published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const m of DEFAULT_SITE_CONTENT.teamMembers) {
      stmt.run(
        m.id,
        m.slotIndex,
        m.name,
        m.roleTitle,
        m.discipline,
        m.bio,
        m.accentHex,
        m.photoUrl,
        JSON.stringify(m.socialLinks),
        m.sortOrder,
        m.isPublished ? 1 : 0,
        now,
      );
    }
  }

  const productsCount = (
    db.prepare('SELECT COUNT(*) as cnt FROM products').get() as { cnt: number }
  ).cnt;
  if (productsCount === 0) {
    const stmt = db.prepare(
      `INSERT INTO products
       (id, name, category, tagline, summary, problem_solved, features_json, accent_hex, image_path, external_url, is_flagship, is_published, architecture_note, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const p of DEFAULT_SITE_CONTENT.products) {
      stmt.run(
        p.id,
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
        p.sortOrder,
        now,
      );
    }
  }

  const programsCount = (
    db.prepare('SELECT COUNT(*) as cnt FROM software_programs').get() as { cnt: number }
  ).cnt;
  if (programsCount === 0) {
    const stmt = db.prepare(
      `INSERT INTO software_programs
       (id, name, category, purpose, problem_solved, features_json, accent_hex, is_published, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const prog of DEFAULT_SITE_CONTENT.softwarePrograms) {
      stmt.run(
        prog.id,
        prog.name,
        prog.category,
        prog.purpose,
        prog.problemSolved,
        JSON.stringify(prog.features),
        prog.accentHex,
        prog.isPublished ? 1 : 0,
        prog.sortOrder,
        now,
      );
    }
  }

  const coursesCount = (
    db.prepare('SELECT COUNT(*) as cnt FROM courses').get() as { cnt: number }
  ).cnt;
  if (coursesCount === 0) {
    const stmt = db.prepare(
      `INSERT INTO courses
       (id, title, audience, focus, project_outcome, image_path, enroll_url, accent_hex, is_published, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const c of DEFAULT_SITE_CONTENT.courses) {
      stmt.run(
        c.id,
        c.title,
        c.audience,
        c.focus,
        c.projectOutcome,
        c.imagePath,
        c.enrollUrl,
        c.accentHex,
        c.isPublished ? 1 : 0,
        c.sortOrder,
        now,
      );
    }
  }

  const projectsCount = (
    db.prepare('SELECT COUNT(*) as cnt FROM projects').get() as { cnt: number }
  ).cnt;
  if (projectsCount === 0) {
    const stmt = db.prepare(
      `INSERT INTO projects
       (id, slug, title, category, summary, overview, problem_solved, our_solution, features_json, technologies_json, thumbnail_url, screenshots_json, outcomes_json, related_product_id, is_featured, is_published, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const pr of DEFAULT_SITE_CONTENT.projects) {
      stmt.run(
        pr.id,
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
        pr.sortOrder,
        now,
      );
    }
  }

  const socialCount = (
    db.prepare('SELECT COUNT(*) as cnt FROM social_links').get() as { cnt: number }
  ).cnt;
  if (socialCount === 0) {
    const stmt = db.prepare(
      `INSERT INTO social_links (id, platform, label, url, sort_order, is_published, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const s of DEFAULT_SITE_CONTENT.socialLinks) {
      stmt.run(s.id, s.platform, s.label, s.url, s.sortOrder, s.isPublished ? 1 : 0, now);
    }
  }

  const testimonialsCount = (
    db.prepare('SELECT COUNT(*) as cnt FROM testimonials').get() as { cnt: number }
  ).cnt;
  if (testimonialsCount === 0) {
    const stmt = db.prepare(
      `INSERT INTO testimonials
       (id, category, category_label, quote, author_name, author_role, institution_or_track, outcome_note, photo_url, logo_url, related_project_id, is_featured, is_published, sort_order, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const t of DEFAULT_SITE_CONTENT.testimonials) {
      stmt.run(
        t.id,
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
        t.sortOrder,
        now,
      );
    }
  } else {
    // Replace prior unedited fabricated demo names cleanly with editable placeholders if unchanged
    const legacySeedNames = [
      'Sarah Namukasa',
      'Grace Akello',
      'David Kiggundu',
      'Brian Mugisha',
      'Ruth Nabirye',
      'Samuel Ochieng',
    ];
    const rows = db.prepare('SELECT id, author_name FROM testimonials').all() as {
      id: string;
      author_name: string;
    }[];
    const hasOnlyLegacySeeds =
      rows.length > 0 && rows.every((r) => legacySeedNames.includes(r.author_name));
    if (hasOnlyLegacySeeds) {
      db.transaction(() => {
        db.prepare('DELETE FROM testimonials').run();
        const stmt = db.prepare(
          `INSERT INTO testimonials
           (id, category, category_label, quote, author_name, author_role, institution_or_track, outcome_note, photo_url, logo_url, related_project_id, is_featured, is_published, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        for (const t of DEFAULT_SITE_CONTENT.testimonials) {
          stmt.run(
            t.id,
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
            t.sortOrder,
            now,
          );
        }
      })();
    }
  }
}

function safeParseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSiteContent(db: Database.Database, publishedOnly: boolean): SiteContentPayload {
  const settingsRows = db.prepare('SELECT key, value_json FROM site_settings').all() as {
    key: string;
    value_json: string;
  }[];
  const settingsMap = new Map(settingsRows.map((r) => [r.key, r.value_json]));

  const parsedHomepage = safeParseJson<Partial<HomepageSettings>>(
    settingsMap.get('homepage'),
    DEFAULT_SITE_CONTENT.homepage,
  );
  const homepage: HomepageSettings = {
    ...DEFAULT_SITE_CONTENT.homepage,
    ...parsedHomepage,
    featuredProductIds: Array.isArray(parsedHomepage.featuredProductIds)
      ? parsedHomepage.featuredProductIds
      : DEFAULT_SITE_CONTENT.homepage.featuredProductIds,
    featuredProjectIds: Array.isArray(parsedHomepage.featuredProjectIds)
      ? parsedHomepage.featuredProjectIds
      : DEFAULT_SITE_CONTENT.homepage.featuredProjectIds,
    featuredTestimonialIds: Array.isArray(parsedHomepage.featuredTestimonialIds)
      ? parsedHomepage.featuredTestimonialIds
      : DEFAULT_SITE_CONTENT.homepage.featuredTestimonialIds,
    sectionVisibility: {
      ...DEFAULT_SITE_CONTENT.homepage.sectionVisibility,
      ...(parsedHomepage.sectionVisibility || {}),
    },
  };

  const about: AboutSettings = {
    ...DEFAULT_SITE_CONTENT.about,
    ...safeParseJson<Partial<AboutSettings>>(
      settingsMap.get('about'),
      DEFAULT_SITE_CONTENT.about,
    ),
  };
  const contact: ContactSettings = {
    ...DEFAULT_SITE_CONTENT.contact,
    ...safeParseJson<Partial<ContactSettings>>(
      settingsMap.get('contact'),
      DEFAULT_SITE_CONTENT.contact,
    ),
  };
  const seo: SeoSettings = {
    ...DEFAULT_SITE_CONTENT.seo,
    ...safeParseJson<Partial<SeoSettings>>(settingsMap.get('seo'), DEFAULT_SITE_CONTENT.seo),
  };

  const filterClause = publishedOnly ? 'WHERE is_published = 1' : '';

  const teamRows = db
    .prepare(`SELECT * FROM team_members ${filterClause} ORDER BY sort_order ASC, slot_index ASC`)
    .all() as Record<string, unknown>[];
  const teamMembers: TeamMember[] = teamRows.map((r) => ({
    id: String(r.id),
    slotIndex: String(r.slot_index),
    name: String(r.name),
    roleTitle: String(r.role_title),
    discipline: String(r.discipline),
    bio: String(r.bio),
    accentHex: String(r.accent_hex),
    photoUrl: String(r.photo_url || ''),
    socialLinks: safeParseJson(String(r.social_links_json || '{}'), {}),
    sortOrder: Number(r.sort_order),
    isPublished: Number(r.is_published) === 1,
  }));

  const productRows = db
    .prepare(`SELECT * FROM products ${filterClause} ORDER BY sort_order ASC`)
    .all() as Record<string, unknown>[];
  const products: ProductItem[] = productRows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    category: String(r.category),
    tagline: String(r.tagline),
    summary: String(r.summary),
    problemSolved: String(r.problem_solved),
    features: safeParseJson<string[]>(String(r.features_json || '[]'), []),
    accentHex: String(r.accent_hex),
    imagePath: String(r.image_path || ''),
    externalUrl: String(r.external_url || ''),
    isFlagship: Number(r.is_flagship) === 1,
    isPublished: Number(r.is_published) === 1,
    architectureNote: String(r.architecture_note || ''),
    sortOrder: Number(r.sort_order),
  }));

  const programRows = db
    .prepare(`SELECT * FROM software_programs ${filterClause} ORDER BY sort_order ASC`)
    .all() as Record<string, unknown>[];
  const softwarePrograms: SoftwareProgramItem[] = programRows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    category: String(r.category),
    purpose: String(r.purpose),
    problemSolved: String(r.problem_solved),
    features: safeParseJson<string[]>(String(r.features_json || '[]'), []),
    accentHex: String(r.accent_hex),
    isPublished: Number(r.is_published) === 1,
    sortOrder: Number(r.sort_order),
  }));

  const courseRows = db
    .prepare(`SELECT * FROM courses ${filterClause} ORDER BY sort_order ASC`)
    .all() as Record<string, unknown>[];
  const courses: CourseItem[] = courseRows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    audience: String(r.audience),
    focus: String(r.focus),
    projectOutcome: String(r.project_outcome),
    imagePath: String(r.image_path || ''),
    enrollUrl: String(r.enroll_url || '/contact'),
    accentHex: String(r.accent_hex),
    isPublished: Number(r.is_published) === 1,
    sortOrder: Number(r.sort_order),
  }));

  const projectRows = db
    .prepare(`SELECT * FROM projects ${filterClause} ORDER BY sort_order ASC`)
    .all() as Record<string, unknown>[];
  const projects: ProjectItem[] = projectRows.map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    category: String(r.category) as ProjectCategory,
    summary: String(r.summary),
    overview: String(r.overview),
    problemSolved: String(r.problem_solved),
    ourSolution: String(r.our_solution),
    features: safeParseJson<string[]>(String(r.features_json || '[]'), []),
    technologies: safeParseJson<string[]>(String(r.technologies_json || '[]'), []),
    thumbnailUrl: String(r.thumbnail_url || ''),
    screenshots: safeParseJson<string[]>(String(r.screenshots_json || '[]'), []),
    outcomes: safeParseJson<string[]>(String(r.outcomes_json || '[]'), []),
    relatedProductId: String(r.related_product_id || ''),
    isFeatured: Number(r.is_featured) === 1,
    isPublished: Number(r.is_published) === 1,
    sortOrder: Number(r.sort_order),
  }));

  const socialRows = db
    .prepare(`SELECT * FROM social_links ${filterClause} ORDER BY sort_order ASC`)
    .all() as Record<string, unknown>[];
  const socialLinks: SocialLinkItem[] = socialRows.map((r) => ({
    id: String(r.id),
    platform: String(r.platform) as SocialLinkItem['platform'],
    label: String(r.label),
    url: String(r.url),
    sortOrder: Number(r.sort_order),
    isPublished: Number(r.is_published) === 1,
  }));

  const testimonialRows = db
    .prepare(`SELECT * FROM testimonials ${filterClause} ORDER BY sort_order ASC`)
    .all() as Record<string, unknown>[];
  const testimonials: TestimonialCmsItem[] = testimonialRows.map((r) => ({
    id: String(r.id),
    category: String(r.category) as 'voxlan' | 'student',
    categoryLabel: String(r.category_label),
    quote: String(r.quote),
    authorName: String(r.author_name),
    authorRole: String(r.author_role),
    institutionOrTrack: String(r.institution_or_track),
    outcomeNote: String(r.outcome_note),
    photoUrl: String(r.photo_url || ''),
    logoUrl: String(r.logo_url || ''),
    relatedProjectId: String(r.related_project_id || ''),
    isFeatured: Number(r.is_featured) === 1,
    isPublished: Number(r.is_published) === 1,
    sortOrder: Number(r.sort_order),
  }));

  return {
    homepage,
    about,
    contact,
    seo,
    teamMembers,
    products,
    softwarePrograms,
    courses,
    projects,
    socialLinks,
    testimonials,
  };
}
