const gh = [
  'freshworks', 'freshworkscareers', 'chargebee', 'chargebeeinc', 'innovaccer',
  'rippling', 'ripplinghq', 'epam', 'epamsystems', 'zapier', 'deel', 'deelhq',
  'razorpay', 'swiggy', 'phonepe', 'urbancompany', 'dream11', 'sprinklr',
];
const lv = [
  'swiggy', 'swiggy-in', 'razorpay', 'razorpaysoftware', 'dream11', 'dream-sports',
  'urbancompany', 'ucweb', 'phonepe', 'phone-pe', 'chargebee', 'freshworks',
];

async function test(slug, type) {
  const u =
    type === 'gh'
      ? `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`
      : `https://api.lever.co/v0/postings/${slug}?mode=json`;
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
    if (r.ok) return { slug, type, ok: true, status: r.status };
    return { slug, type, ok: false, status: r.status };
  } catch (e) {
    return { slug, type, ok: false, err: e.message };
  }
}

(async () => {
  const hits = [];
  for (const s of gh) {
    const r = await test(s, 'gh');
    if (r.ok) hits.push(r);
    else process.stdout.write('.');
  }
  console.log('\nGH hits:', hits);
  const lvHits = [];
  for (const s of lv) {
    const r = await test(s, 'lv');
    if (r.ok) lvHits.push(r);
    else process.stdout.write('.');
  }
  console.log('\nLV hits:', lvHits);
})();
