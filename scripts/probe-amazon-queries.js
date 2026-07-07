const qs = ['University', 'intern', 'New Grad', 'SDE I', 'SDE-1', 'graduate', 'UTA'];
for (const q of qs) {
  const d = await (
    await fetch(
      `https://www.amazon.jobs/en/search.json?offset=0&result_limit=5&base_query=${encodeURIComponent(q)}&loc_query=India`
    )
  ).json();
  const india = (d.jobs || []).filter((j) => j.country_code === 'IND');
  console.log(q, 'hits', d.hits, 'india', india.length, india[0] && india[0].title.trim());
}
