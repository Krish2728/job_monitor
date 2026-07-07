const ASHBY_API = 'https://api.ashbyhq.com/posting-api/job-board';

export async function fetchAshbyJobs(company) {
  const slug = company.board_slug;
  if (!slug) {
    throw new Error(`Missing board_slug for ${company.name}`);
  }

  const response = await fetch(`${ASHBY_API}/${slug}`, {
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Ashby ${company.name} returned ${response.status}`);
  }

  const data = await response.json();
  return (data.jobs || []).map((job) => ({
    company: company.name,
    job_id: job.id,
    role: job.title,
    link: job.jobUrl,
    location: job.location || '',
    pay: null,
    description: job.descriptionPlain || '',
  }));
}
