const LV_API = 'https://api.lever.co/v0/postings';

export async function fetchLeverJobs(company) {
  const slug = company.board_slug;
  if (!slug) {
    throw new Error(`Missing board_slug for ${company.name}`);
  }

  const response = await fetch(`${LV_API}/${slug}?mode=json`, {
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Lever ${company.name} returned ${response.status}`);
  }

  const jobs = await response.json();
  return jobs.map((job) => ({
    company: company.name,
    job_id: job.id,
    role: job.text,
    link: job.hostedUrl,
    location: job.categories?.location || '',
    pay: null,
    description: stripHtml(job.description || job.descriptionPlain || ''),
  }));
}

function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
