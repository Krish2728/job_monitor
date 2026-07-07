const SEARCH_URL = 'https://www.amazon.jobs/en/search.json';
const PAGE_SIZE = 100;
const MAX_OFFSET = 1500;

function normalizeJob(job, companyName) {
  const jobId = String(job.id_icims || job.id);
  const path = job.job_path || `/en/jobs/${jobId}`;
  return {
    company: companyName,
    job_id: jobId,
    role: (job.title || '').trim(),
    link: `https://www.amazon.jobs${path}`,
    location: job.location || job.normalized_location || '',
    pay: null,
    description: [
      job.description_short,
      job.basic_qualifications,
      job.preferred_qualifications,
    ]
      .filter(Boolean)
      .join(' '),
  };
}

export async function fetchAmazonJobs(company) {
  const queries = company.search_queries || ['SDE', 'SDE I', 'intern', 'University'];
  const seen = new Map();

  for (const query of queries) {
    for (let offset = 0; offset <= MAX_OFFSET; offset += PAGE_SIZE) {
      const url = `${SEARCH_URL}?offset=${offset}&result_limit=${PAGE_SIZE}&base_query=${encodeURIComponent(query)}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });

      if (!response.ok) {
        throw new Error(`Amazon search returned ${response.status} for query "${query}"`);
      }

      const data = await response.json();
      const jobs = data.jobs || [];
      if (!jobs.length) break;

      for (const job of jobs) {
        if (job.country_code !== 'IND') continue;
        const id = String(job.id_icims || job.id);
        if (!id || seen.has(id)) continue;
        seen.set(id, normalizeJob(job, company.name));
      }

      if (jobs.length < PAGE_SIZE) break;
    }
  }

  return [...seen.values()];
}
