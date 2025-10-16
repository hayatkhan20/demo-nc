import { Router } from 'express';
import { fetchWithCache } from '../utils/fetchWithCache.js';
import { config } from '../config.js';

// ------------------------------
// Lookups (strict, no raw URLs)
// ------------------------------
const CDN_BASE = config.cdnBaseUrl.replace(/\/$/, ''); // no trailing slash

export const VOTER_FILES = {
  2:"/Counties/Voter/ncvoter_summary_2.json",
  3:"/Counties/Voter/ncvoter_summary_3.json",
  8:"/Counties/Voter/ncvoter_summary_8.json",
  12:"/Counties/Voter/ncvoter_summary_12.json",
  15:"/Counties/Voter/ncvoter_summary_15.json",
  17:"/Counties/Voter/ncvoter_summary_17.json",
  21:"/Counties/Voter/ncvoter_summary_21.json",
  22:"/Counties/Voter/ncvoter_summary_22.json",
  38:"/Counties/Voter/ncvoter_summary_38.json",
  48:"/Counties/Voter/ncvoter_summary_48.json",
  52:"/Counties/Voter/ncvoter_summary_52.json",
  60:"/Counties/Voter/ncvoter_summary_60.json",
  61:"/Counties/Voter/ncvoter_summary_61.json",
  71:"/Counties/Voter/ncvoter_summary_71.json",
  72:"/Counties/Voter/ncvoter_summary_72.json",
  80:"/Counties/Voter/ncvoter_summary_80.json",
  87:"/Counties/Voter/ncvoter_summary_87.json",
  89:"/Counties/Voter/ncvoter_summary_89.json",
  94:"/Counties/Voter/ncvoter_summary_94.json",
  100:"/Counties/Voter/ncvoter_summary_100.json",
};
export const HIS_FILES = {
  2:"/Counties/His/ncvhis_summary_2.json",
  3:"/Counties/His/ncvhis_summary_3.json",
  8:"/Counties/His/ncvhis_summary_8.json",
  12:"/Counties/His/ncvhis_summary_12.json",
  15:"/Counties/His/ncvhis_summary_15.json",
  17:"/Counties/His/ncvhis_summary_17.json",
  21:"/Counties/His/ncvhis_summary_21.json",
  22:"/Counties/His/ncvhis_summary_22.json",
  38:"/Counties/His/ncvhis_summary_38.json",
  48:"/Counties/His/ncvhis_summary_48.json",
  52:"/Counties/His/ncvhis_summary_52.json",
  60:"/Counties/His/ncvhis_summary_60.json",
  61:"/Counties/His/ncvhis_summary_61.json",
  71:"/Counties/His/ncvhis_summary_71.json",
  72:"/Counties/His/ncvhis_summary_72.json",
  80:"/Counties/His/ncvhis_summary_80.json",
  87:"/Counties/His/ncvhis_summary_87.json",
  89:"/Counties/His/ncvhis_summary_89.json",
  94:"/Counties/His/ncvhis_summary_94.json",
  100:"/Counties/His/ncvhis_summary_100.json",
};

// Labels
const RACE   = {A:"Asian",B:"Black/African American",I:"American Indian/Alaska Native",M:"Two or more races",O:"Other",P:"NH/PI",U:"Undesignated",W:"White"};
const ETH    = {HL:"Hispanic/Latino", NL:"Not Hispanic/Not Latino", UN:"Undesignated"};
const GENDER = {M:"Male", F:"Female", U:"Undesignated"};
const PARTY  = {DEM:"Democratic", REP:"Republican", UNA:"Unaffiliated", LIB:"Libertarian", GRE:"Green", CST:"Constitution"};

function urlFor(path) { return `${CDN_BASE}${path}`; }
function asArray(x){ return Array.isArray(x) ? x : (x!=null ? [x] : []); }
function title(s){ return (s||'').replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase()); }
function sum(obj) { return Object.values(obj||{}).reduce((a,b)=>a+(+b||0),0); }
function pct(part, total) { const t = +total||0; return t>0 ? +(((part/t)*100).toFixed(2)) : 0; }
function pickKeys(obj, keys){ const out={}; for(const k of keys){ if(obj?.[k]!=null) out[k]=obj[k]; } return out; }
function normalizeCodes(arr){ return arr.map(s=>String(s).trim().toUpperCase()); }
function stripZero(obj){ const out={}; for(const [k,v] of Object.entries(obj||{})){ const n=+v||0; if(n>0) out[k]=n; } return out; }

async function fetchJson(path) {
  const { status, body } = await fetchWithCache(urlFor(path));
  if (status>=400) throw new Error(`Upstream ${status}`);
  return JSON.parse(body);
}

// ------------------------------
// Router
// ------------------------------
export const search = Router();

/** GET /api/search/counties → [{ county_id, county_desc }] */
search.get('/search/counties', async (_req, res, next) => {
  try {
    const ids = Array.from(new Set([...Object.keys(VOTER_FILES), ...Object.keys(HIS_FILES)])).map(Number).sort((a,b)=>a-b);
    const rows = [];
    for (const id of ids) {
      const file = VOTER_FILES[id] || HIS_FILES[id];
      const json = await fetchJson(file);
      const county_desc = json.county_desc || json.county || `County ${id}`;
      rows.push({ county_id: id, county_desc });
    }
    res.json(rows);
  } catch (e) { next(e); }
});

/** POST /api/search/demographics
 * body: { county_ids?: number[], party?: string[], race?: string[], ethnicity?: string[], gender?: string[], age_bands?: string[] }
 */
search.post('/search/demographics', async (req, res) => {
  try {
    const body = req.body || {};
    const county_ids = (body.county_ids?.length ? body.county_ids : Object.keys(VOTER_FILES).map(Number));
    const parties = normalizeCodes(asArray(body.party));
    const races   = normalizeCodes(asArray(body.race));
    const eths    = normalizeCodes(asArray(body.ethnicity));
    const genders = normalizeCodes(asArray(body.gender));
    const ages    = asArray(body.age_bands).map(String);

    const perCounty = [];
    for (const id of county_ids) {
      const path = VOTER_FILES[id];
      if (!path) continue;
      const j = await fetchJson(path);
      const county_desc = j.county_desc || j.county || `County ${id}`;
      const as_of = j.as_of || j.updated || null;

      // Support both schemas (new nested counts.* and old top-level)
      const counts = j.counts || {};

      const mParty = stripZero(j.party     || counts.party     || {});
      const mRace  = stripZero(j.race      || counts.race      || {});
      const mEth   = stripZero(j.ethnicity || counts.ethnicity || {});
      const mGen   = stripZero(j.gender    || counts.gender    || {});
      const mAge   = stripZero(j.age_bands || counts.age_bands || j.age || {});

      // Apply filters (if provided)
      const fParty = parties.length ? pickKeys(mParty, parties) : mParty;
      const fRace  = races.length   ? pickKeys(mRace, races)    : mRace;
      const fEth   = eths.length    ? pickKeys(mEth, eths)      : mEth;
      const fGen   = genders.length ? pickKeys(mGen, genders)   : mGen;
      const fAge   = ages.length    ? pickKeys(mAge, ages)      : mAge;

      // Totals: prefer explicit numeric, then object sum, else bucket sums
      const total_all =
        (+j.total) ||
        (typeof j.totals === 'number' ? +j.totals : sum(j.totals || {})) ||
        sum(mParty) || sum(mRace) || sum(mEth) || sum(mGen) || sum(mAge) || 0;

      const subtotal  = sum(fParty) || sum(fRace) || sum(fEth) || sum(fGen) || sum(fAge) || total_all;

      const pctMap = (obj, denom) => {
        const out={}; for (const [k,v] of Object.entries(obj)) out[k]=pct(v, denom);
        return out;
      };

      perCounty.push({
        county_id: id,
        county_desc,
        as_of,
        totals: { total_all, subtotal },
        party:     { counts: fParty,     pct: pctMap(fParty, subtotal),     labels: PARTY },
        race:      { counts: fRace,      pct: pctMap(fRace, subtotal),      labels: RACE },
        ethnicity: { counts: fEth,       pct: pctMap(fEth, subtotal),       labels: ETH },
        gender:    { counts: fGen,       pct: pctMap(fGen, subtotal),       labels: GENDER },
        age_bands: { counts: fAge,       pct: pctMap(fAge, subtotal) }
      });
    }

    // Aggregate row if multiple counties selected
    let aggregate = null;
    if (perCounty.length > 1) {
      const aggCounts = (key) => perCounty.reduce((a,c)=>{
        for(const [k,v] of Object.entries(c[key].counts)) a[k]=(a[k]||0)+(+v||0);
        return a;
      },{});
      const total_all = perCounty.reduce((a,c)=>a+(+c.totals.total_all||0),0);
      const subtotal  = perCounty.reduce((a,c)=>a+(+c.totals.subtotal||0),0);

      const partyC = aggCounts('party'); const raceC = aggCounts('race'); const ethC = aggCounts('ethnicity');
      const genC = aggCounts('gender'); const ageC = aggCounts('age_bands');

      const pctMap = (obj, denom) => { const out={}; for(const [k,v] of Object.entries(obj)) out[k]=pct(v, denom); return out; };

      aggregate = {
        county_id: 0,
        county_desc: 'Total',
        as_of: null,
        totals: { total_all, subtotal },
        party:     { counts: partyC, pct: pctMap(partyC, subtotal), labels: PARTY },
        race:      { counts: raceC,  pct: pctMap(raceC,  subtotal), labels: RACE },
        ethnicity: { counts: ethC,   pct: pctMap(ethC,   subtotal), labels: ETH },
        gender:    { counts: genC,   pct: pctMap(genC,   subtotal) },
        age_bands: { counts: ageC,   pct: pctMap(ageC,   subtotal) }
      };
    }

    res.json({ rows: perCounty, aggregate });
  } catch (e) {
    console.error('💥 /api/search/demographics error:', e);
    res.status(400).json({ error: { code: 400, message: e.message || 'Bad Request' } });
  }
});

/** POST /api/search/history
 * body: { county_ids?: number[], election?: string|"latest", dimension: "methods"|"parties"|"precincts" }
 */
search.post('/search/history', async (req, res) => {
  try {
    const body = req.body || {};
    const county_ids = (body.county_ids?.length ? body.county_ids : Object.keys(HIS_FILES).map(Number));
    const dimension = String(body.dimension||'').toLowerCase();
    if (!['methods','parties','precincts'].includes(dimension)) {
      return res.status(400).json({ error: { code: 400, message: 'Invalid dimension' }});
    }
    const electParam = body.election; // may be 'latest' or a label

    const blocks = [];
    for (const id of county_ids) {
      const path = HIS_FILES[id];
      if (!path) continue;
      const j = await fetchJson(path);
      const county_desc = j.county_desc || j.county || `County ${id}`;

      // resolve election label
      let election_lbl = electParam === 'latest' ? j.latest?.election_lbl : electParam;
      if (!election_lbl) {
        election_lbl = j.elections?.[j.elections.length-1]?.election_lbl || j.latest?.election_lbl;
      }
      const electObj = (j.elections || []).find(e => e.election_lbl === election_lbl) || j.latest;

      if (!electObj) {
        blocks.push({ county_id:id, county_desc, election_lbl: '(not found)', total_ballots: 0, rows: [] });
        continue;
      }

      const total_ballots = +electObj.total_ballots || 0;
      let source = [];
      if (dimension === 'methods') {
        source = Object.entries(stripZero(electObj.voting_methods || {}))
                       .map(([k,v]) => ({ label: title(k), ballots: +v, share_pct: pct(v, total_ballots) }));
      } else if (dimension === 'parties') {
        source = Object.entries(stripZero(electObj.parties || {}))
                       .map(([k,v]) => ({ label: PARTY[k] || k, ballots: +v, share_pct: pct(v, total_ballots) }));
      } else { // precincts
        source = Object.entries(stripZero(electObj.precincts || {}))
                       .map(([k,v]) => ({ label: k, ballots: +v, share_pct: pct(v, total_ballots) }));
      }

      blocks.push({ county_id:id, county_desc, election_lbl, total_ballots, rows: source });
    }

    res.json({ blocks, dimension });
  } catch (e) {
    console.error('💥 /api/search/history error:', e);
    res.status(400).json({ error: { code: 400, message: e.message || 'Bad Request' } });
  }
});

/** GET or POST /api/search/download.csv
 * Accepts same payload as /demographics or /history and streams a CSV reflecting normalized output.
 * Use query param ?mode=dem|his to pick handler when using GET.
 */
search.all('/search/download.csv', async (req, res) => {
  try {
    const mode = (req.query.mode || req.body.mode || '').toString().toLowerCase();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');


    if (mode === 'dem') {
      const fake = { body: req.method==='GET' ? JSON.parse(req.query.payload||'{}') : req.body };
      let data;
      await new Promise((resolve, reject) =>
        search.handle({ ...req, url:'/search/demographics', method:'POST', body: fake.body },
          { json: (d)=>{ data=d; resolve(); } }, reject)
      );
      const { rows, aggregate } = data;
      const keys = (obj)=>Object.keys(obj?.counts||{});
      const hdr = [
        'county_id','county_desc','as_of','total_all','subtotal',
        ...keys(rows[0]?.party).map(k=>`party:${k}`),
        ...keys(rows[0]?.race).map(k=>`race:${k}`),
        ...keys(rows[0]?.ethnicity).map(k=>`eth:${k}`),
        ...keys(rows[0]?.gender).map(k=>`gender:${k}`),
        ...keys(rows[0]?.age_bands).map(k=>`age:${k}`)
      ];
      res.write(hdr.join(',')+'\n');
      const emit = (r)=>{
        const line = [
          r.county_id, csv(r.county_desc), r.as_of||'',
          r.totals.total_all, r.totals.subtotal,
          ...keys(r.party).map(k=>r.party.counts[k]||0),
          ...keys(r.race).map(k=>r.race.counts[k]||0),
          ...keys(r.ethnicity).map(k=>r.ethnicity.counts[k]||0),
          ...keys(r.gender).map(k=>r.gender.counts[k]||0),
          ...keys(r.age_bands).map(k=>r.age_bands.counts[k]||0),
        ];
        res.write(line.join(',')+'\n');
      };
      rows.forEach(emit);
      if (aggregate) emit(aggregate);
      res.end();
      return;
    }

    if (mode === 'his') {
      const fake = { body: req.method==='GET' ? JSON.parse(req.query.payload||'{}') : req.body };
      let data;
      await new Promise((resolve, reject) =>
        search.handle({ ...req, url:'/search/history', method:'POST', body: fake.body },
          { json: (d)=>{ data=d; resolve(); } }, reject)
      );
      const { blocks, dimension } = data;
      res.write(['county_id','county_desc','election','total_ballots','label','ballots','share_pct'].join(',')+'\n');
      for (const b of blocks) {
        for (const r of b.rows) {
          res.write([b.county_id, csv(b.county_desc), csv(b.election_lbl), b.total_ballots, csv(r.label), r.ballots, r.share_pct].join(',')+'\n');
        }
      }
      res.end();
      return;
    }

    res.status(400).end('mode required (dem|his)');
  } catch (e) {
    console.error('💥 /search/download.csv error:', e);
    res.status(400).end(`error, ${e.message}`);
  }
});

function csv(v){ const s=String(v??''); return /[,"\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; }
