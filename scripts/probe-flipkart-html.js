import fs from 'fs';

const t = await (
  await fetch('https://www.flipkartcareers.com/jobslist', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  })
).text();

fs.writeFileSync('flipkart-jobslist.html', t);
console.log('saved', t.length);

const items = [...t.matchAll(/<div class="job-item"[\s\S]*?<\/div>\s*<\/div>/g)];
console.log('job-item blocks', items.length);

const h6 = [...t.matchAll(/<h6[^>]*>([\s\S]*?)<\/h6>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
console.log('h6 titles', h6.slice(0, 15));

const links = [...t.matchAll(/href="([^"]*job[^"]*)"/gi)].map((m) => m[1]);
console.log('job links', [...new Set(links)].slice(0, 15));

const locs = [...t.matchAll(/class="location"[^>]*>([\s\S]*?)<\//g)].map((m) => m[1].trim());
console.log('locations', locs.slice(0, 10));
