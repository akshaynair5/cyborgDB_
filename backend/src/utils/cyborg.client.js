import ApiError from './ApiError.js';

const CYBORG_URL = process.env.CYBORG_MICROSERVICE_URL || process.env.CYBORG_URL || 'http://localhost:8000';

let _fetch = global.fetch;
async function getFetch() {
  if (_fetch) return _fetch;
  // node-fetch v2 default export
  const nodeFetch = await import('node-fetch');
  _fetch = nodeFetch.default;
  return _fetch;
}

export async function upsertEncounter(encounter) {
  try {
    const fetch = await getFetch();
    const url = `${CYBORG_URL.replace(/\/$/, '')}/upsert-encounter`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encounter }),
      timeout: 5000
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ApiError(res.status, `Cyborg upsert failed: ${text}`);
    }

    return await res.json();
  } catch (err) {
    // don't throw network failures up to the client for now; log and return null
    console.warn('cyborg.client.upsertEncounter error', err && err.message ? err.message : err);
    return null;
  }
}

export default { upsertEncounter };
