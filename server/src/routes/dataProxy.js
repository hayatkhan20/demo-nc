import { Router } from 'express';
import { fetchWithCache, cache } from '../utils/fetchWithCache.js';
import { config } from '../config.js';

export const dataProxy = Router();

/**
 * Hard-map resource IDs to exact CDN paths for Phase 2.
 * (Keeps browser away from CDN; lets us swap sources without client changes.)
 */
const MAP = {
  counties:   'Base/nc_counties_2017.geojson',
  precincts:  'Base/sbe_precincts_20250728.geojson',
  house:      'Base/st_house_20220223.geojson',
  senate:     'Base/st_senate_20220223.geojson',
  congress:   'Base/us_congress_20220223.geojson'
};

function fullUrl(relPath) {
  return `${config.cdnBaseUrl}${relPath}`;
}

async function serveResource(relPath, req, res, next) {
  try {
    const url = fullUrl(relPath);
    console.log('[proxy] ->', url);
    const cached = cache.get(url);

    // Handle client conditional request locally, if we have an ETag
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && cached?.etag && ifNoneMatch === cached.etag) {
      res.status(304).end();
      return;
    }

    const { status, etag, lastModified, contentType, body } = await fetchWithCache(url);

    if (etag) res.setHeader('ETag', etag);
    if (lastModified) res.setHeader('Last-Modified', lastModified);
    res.setHeader('Content-Type', contentType);
    res.status(status).send(body);
  } catch (err) {
    next(err);
  }
}

dataProxy.get('/data/counties',   (req, res, next) => serveResource(MAP.counties,  req, res, next));
dataProxy.get('/data/precincts',  (req, res, next) => serveResource(MAP.precincts, req, res, next));
dataProxy.get('/data/house',      (req, res, next) => serveResource(MAP.house,     req, res, next));
dataProxy.get('/data/senate',     (req, res, next) => serveResource(MAP.senate,    req, res, next));
dataProxy.get('/data/congress',   (req, res, next) => serveResource(MAP.congress,  req, res, next));
