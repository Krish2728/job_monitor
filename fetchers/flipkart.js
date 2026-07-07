import { createHash } from 'crypto';

const JOBS_URL = 'https://www.flipkartcareers.com/jobslist';

function stripHtml(text = '') {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseJobCards(html) {
  const jobs = [];
  const blockRegex =
    /<div class="col-md-4 job-item">[\s\S]*?<h6>([\s\S]*?)<\/h6>[\s\S]*?<strong>([\s\S]*?)<\/strong>/g;

  for (const match of html.matchAll(blockRegex)) {
    const role = stripHtml(match[1]);
    const location = stripHtml(match[2]);
    if (!role) continue;

    const jobId = createHash('sha256')
      .update(`${role}|${location}`)
      .digest('hex')
      .slice(0, 16);

    jobs.push({
      company: 'Flipkart',
      job_id: jobId,
      role,
      link: JOBS_URL,
      location,
      pay: null,
      description: '',
    });
  }

  return jobs;
}

export async function fetchFlipkartJobs(company) {
  const response = await fetch(company.careers_url || JOBS_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; C2RJobMonitor/1.0)' },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Flipkart careers returned ${response.status}`);
  }

  const html = await response.text();
  const jobs = parseJobCards(html);

  if (!jobs.length) {
    throw new Error('Flipkart HTML parser found 0 job cards');
  }

  return jobs;
}
