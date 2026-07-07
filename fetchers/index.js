import { fetchAmazonJobs } from './amazon.js';
import { fetchAshbyJobs } from './ashby.js';
import { fetchFlipkartJobs } from './flipkart.js';
import { fetchGreenhouseJobs } from './greenhouse.js';
import { fetchLeverJobs } from './lever.js';

const FETCHERS = {
  amazon: fetchAmazonJobs,
  flipkart: fetchFlipkartJobs,
  greenhouse: fetchGreenhouseJobs,
  lever: fetchLeverJobs,
  ashby: fetchAshbyJobs,
};

const SLUGLESS_ATS = new Set(['amazon', 'flipkart']);

export async function fetchCompanyJobs(company) {
  const fetcher = FETCHERS[company.ats];
  if (!fetcher) {
    throw new Error(`No fetcher for ATS "${company.ats}" (${company.name})`);
  }
  return fetcher(company);
}

export function isFetchable(company) {
  if (!company.enabled || !FETCHERS[company.ats]) return false;
  if (SLUGLESS_ATS.has(company.ats)) return true;
  return Boolean(company.board_slug);
}
