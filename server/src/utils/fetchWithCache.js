import { LRUCache } from 'lru-cache';
import fetch from 'node-fetch';

export const cache = new LRUCache({
  max: 50,                 // ~50 responses
  ttl: 15 * 60 * 1000      // 15 minutes
});

function normalizeContentType(ct) {
  // Prefer GeoJSON type if upstream is generic
  if (!ct) return 'application/geo+json; charset=utf-8';
  if (ct.includes('application/json')) return 'application/geo+json; charset=utf-8';
  return ct;
}

export async function fetchWithCache(url) {
  const cached = cache.get(url);
  if (cached) return { fromCache: true, ...cached };

  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    const err = new Error(`Upstream ${resp.status}: ${text.slice(0, 200)}`);
    err.status = resp.status;
    throw err;
  }

  const etag = resp.headers.get('etag') || undefined;
  const lastModified = resp.headers.get('last-modified') || undefined;
  const contentType = normalizeContentType(resp.headers.get('content-type'));
  const body = await resp.text();

  const value = { status: resp.status, etag, lastModified, contentType, body };
  cache.set(url, value);
  return { fromCache: false, ...value };
}
