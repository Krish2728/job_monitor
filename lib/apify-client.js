const APIFY_BASE = 'https://api.apify.com/v2';

function getToken() {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error('APIFY_TOKEN is not set');
  }
  return token;
}

export function apifyConfigured() {
  return Boolean(process.env.APIFY_TOKEN);
}

export async function runActor(actorId, input, options = {}) {
  const token = getToken();
  const actorPath = actorId.replace('/', '~');
  const waitSecs = options.waitSecs ?? 120;
  const timeoutSecs = options.timeoutSecs ?? 180;

  const startUrl = `${APIFY_BASE}/acts/${actorPath}/runs?token=${token}&waitForFinish=${waitSecs}`;
  const response = await fetch(startUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      ...(options.memory ? {} : {}),
    }),
    signal: AbortSignal.timeout((timeoutSecs + 30) * 1000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apify run failed for ${actorId}: ${response.status} ${text.slice(0, 300)}`);
  }

  const run = await response.json();
  const data = run.data || run;

  if (data.status !== 'SUCCEEDED') {
    throw new Error(`Apify actor ${actorId} ended with status ${data.status}`);
  }

  const datasetId = data.defaultDatasetId;
  if (!datasetId) {
    throw new Error(`Apify run for ${actorId} has no dataset`);
  }

  return getDatasetItems(datasetId, options.limit ?? 200);
}

export async function getDatasetItems(datasetId, limit = 200) {
  const token = getToken();
  const url = `${APIFY_BASE}/datasets/${datasetId}/items?token=${token}&clean=true&format=json&limit=${limit}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });

  if (!response.ok) {
    throw new Error(`Apify dataset fetch failed: ${response.status}`);
  }

  return response.json();
}
