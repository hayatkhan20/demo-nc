import { useEffect, useRef, useState } from 'react';
const API = import.meta.env.VITE_API_BASE_URL;

/**
 * Works with BOTH:
 * - New Phase-8:  GET /api/voter/available -> { counties:[{county_id, county_desc}], ... }
 *                  GET /api/voter/summary?county_id=22
 *                  GET /api/voter/summary/22
 * - Legacy:        GET /api/voter/available -> { county_ids:[...] }
 *                  GET /api/voter/:county_id
 */
export function useCountyDemographics() {
  const cacheRef = useRef(new Map());
  const [available, setAvailable] = useState(new Set());
  const [ready, setReady] = useState(false);

  // --- availability ---------------------------------------------------------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API}/voter/available`);
        const j = await r.json();

        // Accept both shapes
        const ids = Array.isArray(j.county_ids)
          ? j.county_ids
          : Array.isArray(j.counties)
          ? j.counties.map(c => c.county_id)
          : [];

        if (alive) {
          setAvailable(new Set(ids.map(Number)));
          setReady(true);
        }
      } catch {
        if (alive) setReady(true); // fail-open so the map still works
      }
    })();
    return () => { alive = false; };
  }, []);

  // --- summary fetchers -----------------------------------------------------
  async function fetchJsonWithFallbacks(urls) {
    for (const url of urls) {
      try {
        const r = await fetch(url, { headers: { Accept: 'application/json' } });
        if (r.ok) return await r.json();
      } catch { /* try next */ }
    }
    return null;
  }

  async function fetchCounty(county_id) {
    const id = Number(county_id);
    if (cacheRef.current.has(id)) return cacheRef.current.get(id);

    // Try new Phase-8 endpoints first, then legacy:
    const urls = [
      `${API}/voter/summary?county_id=${id}`,
      `${API}/voter/summary/${id}`,
      `${API}/voter/${id}` // legacy (only if voter.js still exists)
    ];

    const json = await fetchJsonWithFallbacks(urls);
    if (json) cacheRef.current.set(id, json);
    return json;
  }

  async function loadWithMeta(county_id) {
    const id = Number(county_id);
    const candidates = [
      `${API}/voter/summary?county_id=${id}`,
      `${API}/voter/summary/${id}`,
      `${API}/voter/${id}`
    ];

    let lastErr = null;
    for (const url of candidates) {
      const t0 = performance.now();
      try {
        const r = await fetch(url, { headers: { Accept: 'application/json' } });
        const t1 = performance.now();
        const meta = {
          ok: r.ok,
          status: r.status,
          durationMs: Math.round(t1 - t0),
          etag: r.headers.get('ETag'),
          lastModified: r.headers.get('Last-Modified'),
          from: url.replace(location.origin, '')
        };
        if (!r.ok) { lastErr = meta; continue; }
        const json = await r.json();
        cacheRef.current.set(id, json);
        return { data: json, meta };
      } catch {
        lastErr = { ok: false, status: 0, durationMs: 0, etag: null, lastModified: null, from: url };
      }
    }
    return { data: null, meta: lastErr || { ok:false, status:0, durationMs:0, etag:null, lastModified:null, from:'<none>' } };
  }

  return {
    ready,
    hasVoterData: (id) => available.has(Number(id)),
    getCached: (id) => cacheRef.current.get(Number(id)),
    load: fetchCounty,
    loadWithMeta,
  };
}
