import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { apifyConfigured } from '../lib/apify-client.js';
import { fetchCrawlSite } from './apify-crawl.js';
import { fetchLinkedInBatch } from './apify-linkedin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, '..', 'config', 'apify-sources.json');

export function isApifyEnabled() {
  if (!apifyConfigured()) return false;
  try {
    const config = loadApifyConfig();
    return config.enabled !== false;
  } catch {
    return false;
  }
}

function loadApifyConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

export async function fetchApifyJobs() {
  const config = loadApifyConfig();
  const allJobs = [];
  const errors = [];

  if (config.linkedin?.searches?.length) {
    try {
      const jobs = await fetchLinkedInBatch(config.linkedin.searches, {
        maxJobsPerSearch: config.linkedin.max_jobs_per_search ?? 20,
      });
      allJobs.push(...jobs);
    } catch (error) {
      errors.push({ source: 'linkedin', message: error.message });
    }
  }

  for (const site of config.crawl?.sites || []) {
    try {
      const jobs = await fetchCrawlSite(site, {
        maxPages: config.crawl.max_pages ?? 3,
      });
      allJobs.push(...jobs);
    } catch (error) {
      errors.push({ source: site.name, message: error.message });
    }
  }

  return { jobs: allJobs, errors };
}
