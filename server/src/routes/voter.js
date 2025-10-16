import { Router } from 'express';
import { fetchWithCache, cache } from '../utils/fetchWithCache.js';
import { config } from '../config.js';
import { VOTER_FILES } from './search.js'; // whitelist from Phase 4

const RACE   = {A:"Asian",B:"Black/African American",I:"American Indian/Alaska Native",M:"Two or more races",O:"Other",P:"NH/PI",U:"Undesignated",W:"White"};
const ETH    = {HL:"Hispanic/Latino", NL:"Not Hispanic/Not Latino", UN:"Undesignated"};
const GENDER = {M:"Male", F:"Female", U:"Undesignated"};
const PARTY  = {DEM:"Democratic", REP:"Republican", UNA:"Unaffiliated", LIB:"Libertarian", GRE:"Green", CST:"Constitution"};

export const voter = Router();
const cdn = (p) => `${config.cdnBaseUrl.replace(/\/$/,'')}${p}`;

const stripZero = (o)=>Object.fromEntries(Object.entries(o||{}).filter(([,v])=>(+v||0)>0));
const sum = (o)=>Object.values(o||{}).reduce((a,b)=>a+(+b||0),0);
const pct1 = (x, t)=> (t>0 ? +( (x/t)*100 ).toFixed(1) : 0);

function normalize(j) {
  const county_id   = j.county_id ?? j.County_ID;
  const county_desc = j.county_desc ?? j.county ?? `County ${county_id}`;
  const as_of       = j.as_of ?? j.updated ?? null;

  const party   = stripZero(j.party     ?? (j.counts?.party)     ?? {});
  const race    = stripZero(j.race      ?? (j.counts?.race)      ?? {});
  const ethnicity = stripZero(j.ethnicity ?? (j.counts?.ethnicity) ?? {});
  const gender  = stripZero(j.gender    ?? (j.counts?.gender)    ?? {});
  const age     = stripZero(j.age_bands ?? (j.counts?.age_bands) ?? {});

  const totals = +j.totals || +j.total || sum(party) || sum(race) || sum(gender) || sum(age);

  const withPct = (m, labels=null) => ({
    counts: m,
    pct: Object.fromEntries(Object.entries(m).map(([k,v])=>[k, pct1(+v, totals)])),
    labels
  });

  return {
    county_id, county_desc, as_of, totals,
    counts: {
      party:     withPct(party, PARTY),
      race:      withPct(race, RACE),
      ethnicity: withPct(ethnicity, ETH),
      gender:    withPct(gender, GENDER),
      age_bands: withPct(age, null)
    }
  };
}

/** GET /api/voter/available -> { county_ids: number[] } */
voter.get('/voter/available', (_req, res) => {
  const ids = Object.keys(VOTER_FILES).map(Number).sort((a,b)=>a-b);
  res.json({ county_ids: ids });
});

/** GET /api/voter/:county_id
 *  200 -> normalized voter summary
 *  404 -> { error:{ code:"NO_VOTER_DATA", message } } if id not whitelisted or upstream 404
 */
voter.get('/voter/:county_id', async (req, res) => {
  const id = Number(req.params.county_id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error:{ code:'BAD_REQUEST', message:'county_id must be a number' }});
  }
  const rel = VOTER_FILES[id];
  if (!rel) {
    return res.status(404).json({ error:{ code:'NO_VOTER_DATA', message:`No voter data mapped for county_id=${id}` }});
  }
  const url = cdn(rel);
  try {
    const ifNone = req.headers['if-none-match'];
    const hit = cache.get(url);
    if (ifNone && hit?.etag && ifNone === hit.etag) return res.status(304).end();

    const { status, body, etag, lastModified, contentType } = await fetchWithCache(url);
    if (etag) res.setHeader('ETag', etag);
    if (lastModified) res.setHeader('Last-Modified', lastModified);
    if (contentType) res.setHeader('Content-Type', 'application/json');

    if (status === 404) {
      return res.status(404).json({ error:{ code:'NO_VOTER_DATA', message:`Upstream not found for county_id=${id}` }});
    }
    if (status >= 400) {
      return res.status(status).json({ error:{ code:'UPSTREAM_ERROR', message:`Upstream ${status}` }});
    }

    const json = JSON.parse(body);
    return res.json(normalize(json));
  } catch (e) {
    return res.status(500).json({ error:{ code:'SERVER_ERROR', message:e.message || 'Unknown error' }});
  }
});
