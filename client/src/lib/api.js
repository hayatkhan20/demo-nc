// client/src/lib/api.js

// VITE_API_BASE_URL should be like: https://server-nc.onrender.com  (no trailing slash required)
const RAW = import.meta.env.VITE_API_BASE_URL || '';
export const API_BASE = RAW.replace(/\/$/, '') + '/api';   // ensure single /api

export async function getBasemapConfig() {
  const r = await fetch(`${API_BASE}/map/basemap-config`);
  if (!r.ok) throw new Error('Basemap config failed');
  return r.json();
}

export const endpoints = {
  // vector layers (via dataProxy router)
  counties:  `${API_BASE}/data/counties`,
  precincts: `${API_BASE}/data/precincts`,
  house:     `${API_BASE}/data/house`,
  senate:    `${API_BASE}/data/senate`,
  congress:  `${API_BASE}/data/congress`,

  // summaries/availability
  voterAvailable: `${API_BASE}/voter/available`,
  hisAvailable:   `${API_BASE}/his/available`,

  // optional helpers if you need them later
  search: (q) => `${API_BASE}/search?q=${encodeURIComponent(q)}`,
};

export const tsEndpoint = (group, year) => `${API_BASE}/timeseries/${group}/${year}`;
