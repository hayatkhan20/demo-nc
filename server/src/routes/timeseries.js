// server/src/routes/timeseries.js
import { Router } from 'express';
import { fetchWithCache, cache } from '../utils/fetchWithCache.js';
import { config } from '../config.js';

export const timeseries = Router();

/** Secure lookup tables: client never passes raw URLs */
const CONGRESS = {
  '2016': 'CongressDistricts_Timeseries/us_congress_2016.geojson',
  '2022': 'CongressDistricts_Timeseries/us_congress_20220223.geojson',
  'ref' : 'CongressDistricts_Timeseries/c-goodwin-a-1-tc.geojson'
};
const HOUSE = {
  '2017': 'HouseDistricts_Timeseries/hb_1020_h_red_comm_csbk-25.geojson',
  '2018': 'HouseDistricts_Timeseries/special_master_house_with_hb927_wake_meck.geojson',
  '2019': 'HouseDistricts_Timeseries/2019_state_house_with_hb1017.geojson',
  '2022': 'HouseDistricts_Timeseries/st_house_20220223.geojson'
};
const SENATE = {
  '2017': 'SenateDistricts_Timeseries/senate_consensus_nonpartisan_map_v3.geojson',
  '2018': 'SenateDistricts_Timeseries/special_master_recommended_senate_plan.geojson',
  '2021': 'SenateDistricts_Timeseries/st_senate_2021.geojson',
  '2022': 'SenateDistricts_Timeseries/st_senate_20220223.geojson'
};

const TABLES = { congress: CONGRESS, house: HOUSE, senate: SENATE };

function fullUrl(relPath) {
  return `${config.cdnBaseUrl}${relPath}`;
}

async function serveLookup(group, year, req, res, next) {
  try {
    const g = String(group || '').toLowerCase();
    const y = String(year || '').toLowerCase();

    const table = TABLES[g];
    if (!table) return res.status(404).json({ error: { code: 404, message: `Unknown group '${g}'` } });

    const rel = table[y];
    if (!rel) return res.status(404).json({ error: { code: 404, message: `Unknown year '${y}' for ${g}` } });

    const url = fullUrl(rel);
    const cached = cache.get(url);

    // Local 304 if client provides If-None-Match matching our cached ETag
    const inm = req.headers['if-none-match'];
    if (inm && cached?.etag && inm === cached.etag) {
      res.status(304).end();
      return;
    }

    const { status, etag, lastModified, contentType, cacheControl, body } = await fetchWithCache(url);

    if (etag) res.setHeader('ETag', etag);
    if (lastModified) res.setHeader('Last-Modified', lastModified);
    // Prefer GeoJSON when possible; fall back to upstream type
    res.setHeader('Content-Type', contentType || 'application/geo+json; charset=utf-8');
    res.setHeader('Cache-Control', cacheControl || 'public, max-age=86400, stale-while-revalidate=600');

    res.status(status).send(body);
  } catch (err) {
    next(err);
  }
}

timeseries.get('/timeseries/:group/:year', (req, res, next) => {
  const { group, year } = req.params;
  serveLookup(group, year, req, res, next);
});

// (Optional) expose available years per group to the UI
timeseries.get('/timeseries/years/:group', (req, res) => {
  const g = String(req.params.group || '').toLowerCase();
  const table = TABLES[g];
  if (!table) return res.status(404).json({ error: { code: 404, message: `Unknown group '${g}'` } });
  res.json({ group: g, years: Object.keys(table) });
});
