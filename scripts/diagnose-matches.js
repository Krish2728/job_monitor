import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchCompanyJobs, isFetchable } from '../fetchers/index.js';
import { scoreJob } from '../lib/matcher.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const companies = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/companies.json'), 'utf8'));
const globalFilters = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/global-filters.json'), 'utf8'));

for (const company of companies) {
  if (!isFetchable(company)) continue;

  try {
    const jobs = await fetchCompanyJobs(company);
    const matched = [];
    const rejected = { title: 0, location: 0, engineering: 0, score: 0 };

    for (const job of jobs) {
      const result = scoreJob(job, company, globalFilters);
      if (result.matched) {
        matched.push(job.role);
      } else {
        const reason = result.reasons[0] || 'unknown';
        if (reason.includes('title') || reason.includes('excluded')) rejected.title++;
        else if (reason.includes('location')) rejected.location++;
        else if (reason.includes('engineering')) rejected.engineering++;
        else rejected.score++;
      }
    }

    console.log(`\n${company.name} (${company.ats})`);
    console.log(`  fetched: ${jobs.length}, matched: ${matched.length}`);
    console.log(`  rejected: title=${rejected.title} location=${rejected.location} eng=${rejected.engineering}`);
    if (matched.length) console.log(`  samples: ${matched.slice(0, 3).join(' | ')}`);
  } catch (error) {
    console.log(`\n${company.name}: ERROR ${error.message}`);
  }
}
