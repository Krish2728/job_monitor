import { createHash } from 'crypto';
import { stripHtml } from './normalize.js';

const JOB_LINK_RE = /job|career|position|opening|requisition|apply|gh_jid|lever|workday/i;

export function parseJobsFromMarkdown(companyName, pageUrl, markdown = '') {
  const jobs = [];
  const seen = new Set();

  // Markdown links: [Title](https://...)
  for (const match of markdown.matchAll(/\[([^\]]{4,120})\]\((https?:\/\/[^)\s]+)\)/g)) {
    const role = stripHtml(match[1]).trim();
    const link = match[2].trim();
    if (!JOB_LINK_RE.test(link) && !JOB_LINK_RE.test(role)) continue;
    addJob(jobs, seen, companyName, role, link, '');
  }

  // Plain URLs on their own line after a heading-ish line
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    const urlMatch = line.match(/^(https?:\/\/\S+)$/);
    if (!urlMatch || !JOB_LINK_RE.test(urlMatch[1])) continue;

    const prev = (lines[i - 1] || '').replace(/^#+\s*/, '').trim();
    if (prev.length < 4 || prev.length > 120) continue;
    addJob(jobs, seen, companyName, prev, urlMatch[1], '');
  }

  if (!jobs.length && markdown.length > 100) {
    // Fallback: treat page as single listing board
    addJob(jobs, seen, companyName, 'Careers listing (see page)', pageUrl, markdown.slice(0, 2000));
  }

  return jobs;
}

function addJob(jobs, seen, company, role, link, description) {
  const key = `${role}|${link}`;
  if (seen.has(key)) return;
  seen.add(key);

  const jobId = createHash('sha256').update(key).digest('hex').slice(0, 16);
  jobs.push({
    company,
    job_id: jobId,
    role,
    link,
    location: '',
    pay: null,
    description,
  });
}
