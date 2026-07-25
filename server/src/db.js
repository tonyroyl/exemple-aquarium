import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { DEFAULT_DESTINATIONS } from './config/destinations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'app.db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS destinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  ft_departments TEXT NOT NULL DEFAULT '[]',
  ft_coverage INTEGER NOT NULL DEFAULT 1,
  lhr_slug TEXT,
  search_terms TEXT NOT NULL DEFAULT '[]',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_id TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL DEFAULT 'france_travail',
  title TEXT NOT NULL,
  company TEXT,
  location_label TEXT,
  department_code TEXT,
  description TEXT,
  contract_type TEXT,
  url TEXT,
  destination_key TEXT,
  category_key TEXT,
  housing_mentioned INTEGER NOT NULL DEFAULT 0,
  seasonal INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  date_created TEXT,
  date_updated TEXT,
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  raw_json TEXT
);

CREATE TABLE IF NOT EXISTS job_status (
  job_id INTEGER PRIMARY KEY REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'nouvelle',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  jobs_fetched INTEGER DEFAULT 0,
  jobs_new INTEGER DEFAULT 0,
  error TEXT
);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

function seedDestinations(db) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM destinations').get().c;
  if (count > 0) return;
  const insert = db.prepare(`
    INSERT INTO destinations (key, label, ft_departments, ft_coverage, lhr_slug, search_terms, enabled)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  for (const dest of DEFAULT_DESTINATIONS) {
    insert.run(
      dest.key,
      dest.label,
      JSON.stringify(dest.ftDepartments || []),
      dest.ftCoverage ? 1 : 0,
      dest.lhrSlug || null,
      JSON.stringify(dest.searchTerms || [])
    );
  }
}

export function createDb(dbPath = DEFAULT_DB_PATH) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  seedDestinations(db);
  return db;
}

let singleton = null;

export function getDb() {
  if (!singleton) {
    singleton = createDb(process.env.DB_PATH || DEFAULT_DB_PATH);
  }
  return singleton;
}
