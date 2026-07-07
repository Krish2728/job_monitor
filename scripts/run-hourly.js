import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchCompanyJobs, isFetchable } from '../fetchers/index.js';
import { fetchApifyJobs, isApifyEnabled } from '../fetchers/apify.js';
import { openDb, upsertJob, logRun } from '../lib/db.js';
import { scoreJob } from '../lib/matcher.js';
import { sendNewJobsEmail } from '../lib/notify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'output');

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function toCsv(rows) {
  if (!rows.length) return 'company,role,job_id,link,location,pay,match_score,match_reason,first_seen_at\n';

  const headers = [
    'company',
    'role',
    'job_id',
    'link',
    'location',
    'pay',
    'match_score',
    'match_reason',
    'first_seen_at',
  ];

  const escape = (value) => {
    const text = value == null ? '' : String(value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function processMatchedJobs(db, jobs, company, globalFilters, summary, newRows) {
  for (const job of jobs) {
    const result = scoreJob(job, company, globalFilters);
    if (!result.matched) continue;

    const record = {
      company: job.company,
      job_id: job.job_id,
      role: job.role,
      link: job.link,
      location: job.location,
      pay: job.pay,
      match_score: result.score,
      match_reason: result.reasons.join('; '),
    };

    const { isNew } = upsertJob(db, record);
    if (isNew) {
      summary.newMatches += 1;
      const row = db
        .prepare(
          'SELECT company, role, job_id, link, location, pay, match_score, match_reason, first_seen_at FROM jobs WHERE company = ? AND job_id = ?'
        )
        .get(record.company, record.job_id);
      newRows.push(row);
    }
  }
}

async function main() {
  const companies = loadJson('config/companies.json');
  const globalFilters = loadJson('config/global-filters.json');
  const companyByName = new Map(companies.map((c) => [c.name.toLowerCase(), c]));
  const db = openDb();

  const summary = {
    companiesChecked: 0,
    jobsFetched: 0,
    apifyJobsFetched: 0,
    apifyEnabled: isApifyEnabled(),
    newMatches: 0,
    errors: [],
  };

  const newRows = [];

  for (const company of companies) {
    if (!isFetchable(company)) continue;

    summary.companiesChecked += 1;

    try {
      const jobs = await fetchCompanyJobs(company);
      summary.jobsFetched += jobs.length;
      processMatchedJobs(db, jobs, company, globalFilters, summary, newRows);
    } catch (error) {
      summary.errors.push({
        company: company.name,
        message: error.message,
      });
      console.error(`[error] ${company.name}: ${error.message}`);
    }
  }

  if (summary.apifyEnabled) {
    try {
      const { jobs: apifyJobs, errors: apifyErrors } = await fetchApifyJobs();
      summary.apifyJobsFetched = apifyJobs.length;
      summary.companiesChecked += 1;

      for (const err of apifyErrors) {
        summary.errors.push({ company: `apify:${err.source}`, message: err.message });
        console.error(`[apify] ${err.source}: ${err.message}`);
      }

      for (const job of apifyJobs) {
        const company = companyByName.get(String(job.company).toLowerCase());
        if (!company) continue;
        processMatchedJobs(db, [job], company, globalFilters, summary, newRows);
      }
    } catch (error) {
      summary.errors.push({ company: 'apify', message: error.message });
      console.error(`[apify] ${error.message}`);
    }
  }

  logRun(db, summary);
  db.close();

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const csv = toCsv(newRows);

  fs.writeFileSync(path.join(OUTPUT_DIR, `new-jobs-${timestamp}.csv`), csv);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'new-jobs-latest.csv'), csv);

  let emailResult = { sent: false, reason: 'not attempted' };
  try {
    emailResult = await sendNewJobsEmail(newRows);
  } catch (error) {
    emailResult = { sent: false, reason: error.message };
    console.error(`[email] ${error.message}`);
  }

  console.log(
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        companiesChecked: summary.companiesChecked,
        jobsFetched: summary.jobsFetched,
        apifyEnabled: summary.apifyEnabled,
        apifyJobsFetched: summary.apifyJobsFetched,
        newMatches: summary.newMatches,
        errors: summary.errors.length,
        email: emailResult,
      },
      null,
      2
    )
  );

  if (summary.errors.length) {
    console.error(JSON.stringify(summary.errors, null, 2));
  }

  const allFailed =
    summary.companiesChecked > 0 &&
    summary.errors.length === summary.companiesChecked;
  process.exit(allFailed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
