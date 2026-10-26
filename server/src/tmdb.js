// Small client for the TMDb API. Every TMDb request goes through tmdbGet so the
// key stays on the server and errors are handled in one place.

const BASE_URL = 'https://api.themoviedb.org/3';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map();

export class TmdbError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function tmdbGet(path, params = {}) {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new TmdbError('TMDB_API_KEY is not set on the server', 500);

  const url = new URL(BASE_URL + path);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(name, value);
    }
  }

  // v4 read tokens are long JWTs (they start with "eyJ"); v3 keys are short.
  const headers = { accept: 'application/json' };
  if (key.startsWith('eyJ')) headers.authorization = `Bearer ${key}`;
  else url.searchParams.set('api_key', key);

  const cacheKey = url.toString();
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) {
    console.log(`cache hit: ${path}`);
    return hit.data;
  }

  let response;
  try {
    response = await fetch(url, { headers });
  } catch {
    throw new TmdbError('Could not reach TMDb', 502);
  }

  if (!response.ok) {
    if (response.status === 404) throw new TmdbError('Not found on TMDb', 404);
    if (response.status === 401) throw new TmdbError('TMDb rejected the API key', 500);
    throw new TmdbError(`TMDb request failed (${response.status})`, 502);
  }
  const data = await response.json();
  cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}
