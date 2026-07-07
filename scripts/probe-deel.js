const t = await (await fetch('https://www.deel.com/careers/')).text();
const boards = [...t.matchAll(/ashbyhq\.com\/([A-Za-z0-9_-]+)/g)].map((m) => m[1]);
console.log('boards', [...new Set(boards)]);
for (const b of [...new Set(boards)]) {
  const r = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${b}`);
  const d = await r.json();
  console.log(b, r.status, d.jobs?.length);
}
