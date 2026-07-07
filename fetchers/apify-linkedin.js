import { runActor } from '../lib/apify-client.js';

const ACTOR = 'curious_coder/linkedin-jobs-scraper';

function pickField(item, keys) {
  for (const key of keys) {
    if (item[key]) return item[key];
  }
  return '';
}

export async function fetchLinkedInBatch(searches, options = {}) {
  const urls = searches.map((s) => s.url);
  const count = options.maxJobsPerSearch ?? 20;

  const items = await runActor(
    ACTOR,
    {
      urls,
      count,
      scrapeCompany: false,
      splitByLocation: false,
    },
    { waitSecs: 120, timeoutSecs: 240, limit: urls.length * count }
  );

  const companyByUrl = new Map(searches.map((s) => [s.url, s.company]));

  return items
    .map((item) => {
      const searchUrl = pickField(item, ['inputUrl', 'searchUrl']);
      const company =
        companyByUrl.get(searchUrl) ||
        pickField(item, ['companyName', 'company', 'company_name']) ||
        'Unknown';

      const link = pickField(item, ['link', 'applyUrl', 'jobUrl', 'jobPostingUrl']);
      const role = pickField(item, ['title', 'jobTitle', 'position']);
      const jobId = pickField(item, ['id', 'refId', 'trackingId']) || link || `${company}-${role}`;

      return {
        company,
        job_id: String(jobId),
        role: String(role).trim(),
        link: String(link).trim(),
        location: pickField(item, ['location', 'jobLocation']),
        pay: pickField(item, ['salary']),
        description: pickField(item, ['descriptionText', 'descriptionHtml']),
      };
    })
    .filter((job) => job.role && job.link);
}
