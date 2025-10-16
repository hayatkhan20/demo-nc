import { Router } from 'express';
import { fetchWithCache } from '../utils/fetchWithCache.js';
import { config } from '../config.js';
import { VOTER_FILES, HIS_FILES } from './search.js';

export const filters = Router();
const cdn = (p) => `${config.cdnBaseUrl.replace(/\/$/,'')}${p}`;

const PARTY_LABELS = {
  DEM: 'Democratic',
  REP: 'Republican',
  UNA: 'Unaffiliated',
  LIB: 'Libertarian',
  GRE: 'Green',
  CST: 'Constitution'
};

const METHOD_KEYS = [
  'EARLY VOTING IN-PERSON',
  'ABSENTEE BY MAIL',
  'ELECTION DAY',
  'PROVISIONAL',
  'TRANSFER'
];

const stripZero = (o) =>
  Object.fromEntries(Object.entries(o || {}).filter(([, v]) => (+v || 0) > 0));

// ---------- Availability ----------

/** GET /api/voter/available -> { counties: [{county_id, county_desc}] } */
filters.get('/voter/available', async (_req, res) => {
  const ids = Object.keys(VOTER_FILES).map(Number).sort((a, b) => a - b);
  const out = [];

  // Try fetching each county JSON just enough to extract county_desc
  for (const id of ids) {
    try {
      const rel = VOTER_FILES[id];
      const { status, body } = await fetchWithCache(cdn(rel));
      if (status >= 400) continue;

      const j = JSON.parse(body);
      const name =
        j.county_desc || j.county || j.County || j.County_Name || `County ${id}`;

      out.push({ county_id: id, county_desc: name });
    } catch {
      // If any file fails, fallback to placeholder
      out.push({ county_id: id, county_desc: `County ${id}` });
    }
  }

  res.json({ counties: out });
});


/** GET /api/his/available -> { counties: [{county_id, county_desc, elections: string[]}] } */
filters.get('/his/available', async (_req, res) => {
  const ids = Object.keys(HIS_FILES).map(Number).sort((a, b) => a - b);
  const out = [];

  for (const id of ids) {
    try {
      const rel = HIS_FILES[id];
      const { status, body } = await fetchWithCache(cdn(rel));
      if (status >= 400) continue;
      const j = JSON.parse(body);
      const county_desc = j.county_desc || j.county || `County ${id}`;
      const elections = (j.elections || []).map((e) => e.election_lbl);
      if (j.latest?.election_lbl && !elections.includes(j.latest.election_lbl)) {
        elections.push(j.latest.election_lbl);
      }
      out.push({ county_id: id, county_desc, elections });
    } catch {
      // If a county file fails, skip it for NCVHIS; VOTER list is independent above
      continue;
    }
  }

  res.json({ counties: out });
});

// ---------- Filters ----------

/** GET /api/voter/filter?county_id=&category=&subgroups=code,code */
filters.get('/voter/filter', async (req, res) => {
  const county_id = Number(req.query.county_id);
  const category = String(req.query.category || '').toLowerCase(); // race|gender|party|ethnicity|age_bands
  const subgroups = arrayQuery(req.query.subgroups).map(String);

  if (!Number.isFinite(county_id) || !VOTER_FILES[county_id]) {
    return res
      .status(400)
      .json({ error: { code: 'BAD_REQUEST', message: 'Unknown or missing county_id' } });
  }

  if (!['race', 'gender', 'party', 'ethnicity', 'age_bands'].includes(category)) {
    return res
      .status(400)
      .json({ error: { code: 'BAD_REQUEST', message: 'Invalid category' } });
  }

  try {
    const { status, body } = await fetchWithCache(cdn(VOTER_FILES[county_id]));
    if (status >= 400) {
      return res
        .status(status)
        .json({ error: { code: 'UPSTREAM', message: `Upstream ${status}` } });
    }

    const j = JSON.parse(body);

    // normalize shapes
    const bucket = j[category] || j.counts?.[category] || {};
    if (j.age_bands && j.age_bands['60_plus'] && !j.age_bands['60+']) {
      j.age_bands['60+'] = j.age_bands['60_plus'];
    }

    const total = Number(j.totals ?? j.total ?? sumAll(j)) || 0;
    const cleaned = stripZero(bucket);
    const keys = subgroups.length ? subgroups : Object.keys(cleaned);
    const counts = Object.fromEntries(keys.map((k) => [k, +cleaned[k] || 0]));

    return res.json({ total, counts });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { code: 'SERVER_ERROR', message: e.message || 'Unknown error' } });
  }
});

/** GET /api/his/filter?county_id=&type=party|method|total&subgroups=&latest=true|false&election_lbl= */
filters.get('/his/filter', async (req, res) => {
  const county_id = Number(req.query.county_id);
  const type = String(req.query.type || '').toLowerCase(); // party|method|total
  const latest = String(req.query.latest || '').toLowerCase() === 'true';
  const election_lbl = latest ? null : String(req.query.election_lbl || '');
  const subgroups = arrayQuery(req.query.subgroups).map(String);

  if (!Number.isFinite(county_id) || !HIS_FILES[county_id]) {
    return res
      .status(400)
      .json({ error: { code: 'BAD_REQUEST', message: 'Unknown or missing county_id' } });
  }
  if (!['party', 'method', 'total'].includes(type)) {
    return res
      .status(400)
      .json({ error: { code: 'BAD_REQUEST', message: 'Invalid type' } });
  }

  try {
    const { status, body } = await fetchWithCache(cdn(HIS_FILES[county_id]));
    if (status >= 400) {
      return res
        .status(status)
        .json({ error: { code: 'UPSTREAM', message: `Upstream ${status}` } });
    }

    const j = JSON.parse(body);
    let elect = null;

    if (latest) elect = j.latest || null;
    else elect = (j.elections || []).find((e) => e.election_lbl === election_lbl) || null;
    if (!elect) elect = j.latest || (j.elections || []).slice(-1)[0] || null;
    if (!elect) {
      return res.json({ election_lbl: election_lbl || 'N/A', total_ballots: 0, rows: [] });
    }

    const total_ballots = +elect.total_ballots || 0;
    if (type === 'total') {
      return res.json({
        election_lbl: elect.election_lbl,
        total_ballots,
        rows: [{ label: 'Total', ballots: total_ballots }]
      });
    }

    if (type === 'party') {
      const src = elect.parties || {};
      const keys = subgroups.length ? subgroups : Object.keys(src);
      const rows = keys
        .map((k) => ({ label: PARTY_LABELS[k] || k, ballots: +src[k] || 0 }))
        .filter((r) => r.ballots > 0)
        .sort((a, b) => b.ballots - a.ballots);
      return res.json({ election_lbl: elect.election_lbl, total_ballots, rows });
    }

    const src = elect.voting_methods || {};
    const keys = subgroups.length
      ? subgroups
      : [
          ...METHOD_KEYS.filter((k) => Object.prototype.hasOwnProperty.call(src, k)),
          ...Object.keys(src)
        ];
    const uniq = Array.from(new Set(keys));
    const rows = uniq
      .map((k) => ({ label: k, ballots: +src[k] || 0 }))
      .filter((r) => r.ballots > 0)
      .sort((a, b) => b.ballots - a.ballots);
    return res.json({ election_lbl: elect.election_lbl, total_ballots, rows });
  } catch (e) {
    return res
      .status(500)
      .json({ error: { code: 'SERVER_ERROR', message: e.message || 'Unknown error' } });
  }
});

// --- Summary (NCVOTER) compatibility routes ---
// GET /api/voter/summary?county_id=60
filters.get('/voter/summary', async (req, res) => {
  const county_id = Number(req.query.county_id);
  if (!Number.isFinite(county_id) || !VOTER_FILES[county_id]) {
    return res.status(400).json({ error:{ code:'BAD_REQUEST', message:'Unknown or missing county_id' }});
  }
  try {
    const { status, body } = await fetchWithCache(cdn(VOTER_FILES[county_id]));
    if (status >= 400) {
      return res.status(status).json({ error:{ code:'UPSTREAM', message:`Upstream ${status}` }});
    }
    res.type('application/json').send(body);
  } catch (e) {
    res.status(500).json({ error:{ code:'SERVER_ERROR', message:e.message || 'Unknown error' }});
  }
});

// GET /api/voter/summary/60
filters.get('/voter/summary/:county_id', async (req, res) => {
  const county_id = Number(req.params.county_id);
  if (!Number.isFinite(county_id) || !VOTER_FILES[county_id]) {
    return res.status(400).json({ error:{ code:'BAD_REQUEST', message:'Unknown or missing county_id' }});
  }
  try {
    const { status, body } = await fetchWithCache(cdn(VOTER_FILES[county_id]));
    if (status >= 400) {
      return res.status(status).json({ error:{ code:'UPSTREAM', message:`Upstream ${status}` }});
    }
    res.type('application/json').send(body);
  } catch (e) {
    res.status(500).json({ error:{ code:'SERVER_ERROR', message:e.message || 'Unknown error' }});
  }
});


// ---------- Helpers ----------

function arrayQuery(q) {
  if (Array.isArray(q))
    return q
      .flatMap((x) => String(x).split(',').map((s) => s.trim()))
      .filter(Boolean);
  if (typeof q === 'string')
    return String(q)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

function sumAll(j) {
  const buckets = [
    j.party,
    j.race,
    j.gender,
    j.ethnicity,
    j.age_bands,
    j?.counts?.party,
    j?.counts?.race,
    j?.counts?.gender,
    j?.counts?.ethnicity,
    j?.counts?.age_bands
  ];
  for (const b of buckets)
    if (b && Object.keys(b).length)
      return Object.values(b).reduce((a, b) => a + (+b || 0), 0);
  return 0;
}
