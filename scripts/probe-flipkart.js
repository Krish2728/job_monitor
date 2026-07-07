const urls = [
  'https://www.flipkartcareers.com/jobslist',
  'https://www.flipkartcareers.com/jobslist?location=Bangalore',
];

for (const url of urls) {
  const t = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  console.log('\n===', url, 'len', t.length);

  const scripts = [...t.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  console.log('scripts', scripts.slice(0, 8));

  const inlineApis = [...t.matchAll(/https?:\/\/[^\"'\s]+/g)]
    .map((m) => m[0])
    .filter((u) => /api|job|career|flipkart/i.test(u));
  console.log('urls in html', [...new Set(inlineApis)].slice(0, 15));

  const nextData = t.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextData) console.log('next data', nextData[1].slice(0, 400));
}

// Try common flipkart internal API patterns
const apiGuesses = [
  'https://www.flipkartcareers.com/api/v1/jobs',
  'https://www.flipkartcareers.com/api/v1/jobs/search',
  'https://www.flipkartcareers.com/api/jobs/search',
  'https://www.flipkartcareers.com/_next/data/jobslist.json',
];

for (const url of apiGuesses) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    console.log('guess', url, r.status, r.headers.get('content-type'));
    if ((r.headers.get('content-type') || '').includes('json')) {
      console.log((await r.text()).slice(0, 300));
    }
  } catch (e) {
    console.log('guess err', url, e.message);
  }
}
