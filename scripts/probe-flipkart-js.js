const t = await (
  await fetch('https://www.flipkartcareers.com/includes/include.js')
).text();
console.log('len', t.length);
const apis = [...t.matchAll(/['"](https?:\/\/[^'"]+)['"]/g)]
  .map((m) => m[1])
  .filter((u) => /api|job|search|flipkart|career/i.test(u));
console.log('urls', [...new Set(apis)]);
console.log('\n--- snippet ---\n');
console.log(t.slice(0, 4000));
