const amazonUrls = [
  'https://www.amazon.jobs/en/search.json?offset=0&result_limit=10',
  'https://www.amazon.jobs/en/search.json?offset=0&result_limit=10&base_query=SDE',
  'https://www.amazon.jobs/en/search.json?offset=0&result_limit=10&loc_query=India',
  'https://www.amazon.jobs/en/search.json?offset=0&result_limit=10&loc_query=Bengaluru',
  'https://www.amazon.jobs/en/search.json?offset=0&result_limit=10&business_category[]=software-development&loc_query=India',
];

for (const url of amazonUrls) {
  const r = await fetch(url);
  const d = await r.json();
  const jobs = d.jobs || [];
  console.log('\n', url.split('?')[1], 'hits', d.hits, 'jobs', jobs.length);
  if (jobs[0]) {
    console.log(' sample:', jobs[0].title, '|', jobs[0].city, jobs[0].country_code, '|', jobs[0].job_id);
  }
}

const flipkartUrls = [
  'https://www.flipkartcareers.com/',
  'https://flipkartcareers.com/api/jobs',
  'https://www.flipkartcareers.com/api/jobs',
  'https://www.flipkartcareers.com/jobs',
];

for (const url of flipkartUrls) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const ct = r.headers.get('content-type') || '';
    console.log('\nflipkart', url, r.status, ct.slice(0, 40));
    if (ct.includes('json')) {
      const d = await r.json();
      console.log(JSON.stringify(d).slice(0, 500));
    } else {
      const t = await r.text();
      const gh = t.match(/greenhouse|lever|workday|ashby|api\.[a-z]+/gi);
      console.log('hints', gh && [...new Set(gh)].slice(0, 10));
      const api = t.match(/https?:\/\/[^\"'\s]+api[^\"'\s]*/gi);
      console.log('api urls', api && [...new Set(api)].slice(0, 5));
    }
  } catch (e) {
    console.log('err', url, e.message);
  }
}
