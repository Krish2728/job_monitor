const GH_API = 'https://boards-api.greenhouse.io/v1/boards';

export async function fetchGreenhouseJobs(company) {
  const slug = company.board_slug;
  if (!slug) {
    throw new Error(`Missing board_slug for ${company.name}`);
  }

  const response = await fetch(`${GH_API}/${slug}/jobs?content=true`, {
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Greenhouse ${company.name} returned ${response.status}`);
  }

  const data = await response.json();
  return (data.jobs || []).map((job) => ({
    company: company.name,
    job_id: String(job.id),
    role: job.title,
    link: job.absolute_url,
    location: job.location?.name || '',
    pay: extractPay(job.content),
    description: stripHtml(job.content || ''),
  }));
}

function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractPay(text = '') {
  const plain = stripHtml(text);
  const inr =
    plain.match(/₹\s?[\d,.]+(?:\s?(?:LPA|lakhs?|lac))?/i) ||
    plain.match(/INR\s?[\d,.]+/i);
  if (inr) return inr[0];

  const usd = plain.match(/\$\s?[\d,.]+(?:\s?-\s?\$?\s?[\d,.]+)?/);
  return usd ? usd[0] : null;
}
