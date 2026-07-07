import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

export function openDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const dbPath = path.join(DATA_DIR, 'jobs.sqlite');
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      company TEXT NOT NULL,
      job_id TEXT NOT NULL,
      role TEXT NOT NULL,
      link TEXT NOT NULL,
      location TEXT,
      pay TEXT,
      match_score INTEGER,
      match_reason TEXT,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      PRIMARY KEY (company, job_id)
    );

    CREATE TABLE IF NOT EXISTS run_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ran_at TEXT NOT NULL,
      companies_checked INTEGER,
      jobs_fetched INTEGER,
      new_matches INTEGER,
      errors TEXT
    );
  `);

  return db;
}

export function upsertJob(db, job) {
  const now = new Date().toISOString();
  const existing = db
    .prepare('SELECT company, job_id FROM jobs WHERE company = ? AND job_id = ?')
    .get(job.company, job.job_id);

  if (existing) {
    db.prepare(
      `UPDATE jobs
       SET role = ?, link = ?, location = ?, pay = ?, match_score = ?, match_reason = ?, last_seen_at = ?
       WHERE company = ? AND job_id = ?`
    ).run(
      job.role,
      job.link,
      job.location,
      job.pay,
      job.match_score,
      job.match_reason,
      now,
      job.company,
      job.job_id
    );
    return { isNew: false };
  }

  db.prepare(
    `INSERT INTO jobs (company, job_id, role, link, location, pay, match_score, match_reason, first_seen_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    job.company,
    job.job_id,
    job.role,
    job.link,
    job.location,
    job.pay,
    job.match_score,
    job.match_reason,
    now,
    now
  );

  return { isNew: true };
}

export function logRun(db, summary) {
  db.prepare(
    `INSERT INTO run_log (ran_at, companies_checked, jobs_fetched, new_matches, errors)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    new Date().toISOString(),
    summary.companiesChecked,
    summary.jobsFetched,
    summary.newMatches,
    JSON.stringify(summary.errors || [])
  );
}
