import { runActor } from '../lib/apify-client.js';
import { parseJobsFromMarkdown } from '../lib/parse-crawl-jobs.js';

const ACTOR = 'apify/website-content-crawler';

export async function fetchCrawlSite(company, options = {}) {
  const startUrl = company.careers_url || company.startUrl;
  const maxPages = options.maxPages ?? 3;

  const items = await runActor(
    ACTOR,
    {
      startUrls: [{ url: startUrl }],
      crawlerType: 'playwright:adaptive',
      maxCrawlDepth: 1,
      maxCrawlPages: maxPages,
      maxResults: maxPages,
      saveMarkdown: true,
      proxyConfiguration: { useApifyProxy: true },
      includeUrlGlobs: options.includeUrlGlobs || [`${new URL(startUrl).origin}/**`],
      excludeUrlGlobs: options.excludeUrlGlobs || [],
    },
    { waitSecs: 120, timeoutSecs: 240, limit: maxPages }
  );

  const jobs = [];
  for (const item of items) {
    const pageUrl = item.url || item.loadedUrl || startUrl;
    const markdown = item.markdown || item.text || '';
    jobs.push(...parseJobsFromMarkdown(company.name, pageUrl, markdown));
  }

  return jobs;
}
