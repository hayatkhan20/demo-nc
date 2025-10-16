// client/src/components/CountyPopup.jsx
import React from 'react';

/** Helpers that work with both old/new shapes */
const PARTY_LABELS = { DEM:'Democratic', REP:'Republican', UNA:'Unaffiliated', LIB:'Libertarian', GRE:'Green', CST:'Constitution' };
const RACE_LABELS  = { A:'Asian', B:'Black/African American', I:'American Indian/Alaska Native', M:'Two or more races', O:'Other', P:'NH/PI', U:'Undesignated', W:'White' };
const GENDER_LABELS = { F:'Female', M:'Male', U:'Undesignated' };
const ETH_LABELS    = { HL:'Hispanic/Latino', NL:'Not Hispanic/Not Latino', UN:'Undesignated' };
const AGE_LABELS    = { '18–24':'18–24','25–34':'25–34','35–44':'35–44','45–59':'45–59','60+':'60+' };

function bucket(obj, key) {
  // Support: counts[key].counts OR counts[key] OR key.counts OR key
  const c = obj?.counts?.[key];
  if (c && typeof c === 'object') {
    if (c.counts && typeof c.counts === 'object') return c.counts;
    return c;
  }
  const k = obj?.[key];
  if (k && typeof k === 'object') {
    if (k.counts && typeof k.counts === 'object') return k.counts;
    return k;
  }
  return {};
}

function pctMap(obj, key) {
  // Use provided pct map if present; else null (we'll compute)
  const c = obj?.counts?.[key];
  return (c && typeof c === 'object' && c.pct && typeof c.pct === 'object') ? c.pct : null;
}

function labelsMap(obj, key, fallback) {
  const c = obj?.counts?.[key];
  if (c && typeof c === 'object' && c.labels && typeof c.labels === 'object') return c.labels;
  return fallback || null;
}

function totalFrom(obj) {
  const t = Number(obj?.totals ?? obj?.total);
  if (Number.isFinite(t) && t > 0) return t;
  const keys = ['party','race','gender','ethnicity','age_bands'];
  for (const k of keys) {
    const b = bucket(obj, k);
    const sum = Object.values(b).reduce((a,v)=>a+(+v||0),0);
    if (sum > 0) return sum;
  }
  return 0;
}

function triplesFrom(obj, key, humanLabels) {
  const b = bucket(obj, key);
  const providedPct = pctMap(obj, key);
  const total = totalFrom(obj) || 1;

  // prefer labels from data, else provided fallback
  const labels = labelsMap(obj, key, humanLabels);

  return Object.entries(b)
    .map(([code, count]) => {
      const v = +count || 0;
      const p = providedPct?.[code] ?? +( (v / total) * 100 ).toFixed(1);
      const label = labels?.[code] || code;
      return [label, v, p];
    })
    .filter(([,_c]) => _c > 0)
    .sort((a,b)=> b[1] - a[1]);
}

/**
 * Default React component (used when rendering via React/ReactDOMServer).
 * Wide, capped height, scrollable; sections arranged in a 2-column grid.
 */
export default function CountyPopupReact({ data, onViewFilters }) {
  if (!data) return <div style={{ padding: 8 }}>No demographics available</div>;

  const { county_desc, as_of } = data;
  const totals = totalFrom(data);

  const Section = ({ title, items }) => (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      {items.map(([lbl, c, p], i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
            <div
              style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              title={lbl}
            >
              {lbl}
            </div>
            <div style={{ minWidth: 56, textAlign: 'right' }}>{Number(c).toLocaleString()}</div>
            <div style={{ minWidth: 44, textAlign: 'right' }}>{p}%</div>
          </div>
          <div aria-hidden style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: 8,
                width: `${Math.min(100, Math.max(0, p))}%`,
                background: '#0EA5E9',
                borderRadius: 4
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const party = triplesFrom(data, 'party', PARTY_LABELS);
  const race  = triplesFrom(data, 'race',  RACE_LABELS);
  const eth   = triplesFrom(data, 'ethnicity', ETH_LABELS);
  const gen   = triplesFrom(data, 'gender', GENDER_LABELS);
  const age   = triplesFrom(data, 'age_bands', AGE_LABELS);

  return (
    <div
      style={{
        width: 480,
        maxWidth: 'min(92vw, 520px)',
        maxHeight: '60vh',
        overflowY: 'auto',
        padding: 12,
        fontSize: 12,
        lineHeight: 1.35
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{county_desc}</div>
        {as_of && (
          <span
            style={{
              fontSize: 11,
              background: '#F8FAFC',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '2px 6px'
            }}
          >
            as of {as_of}
          </span>
        )}
      </div>

      <div style={{ marginTop: 6, fontSize: 13 }}>
        <strong>Total registered:</strong> {Number(totals).toLocaleString()}
      </div>

      {/* Two-column grid for the main four sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
        <Section title="Party" items={party} />
        <Section title="Race" items={race} />
        <Section title="Ethnicity" items={eth} />
        <Section title="Gender" items={gen} />
      </div>

      {/* Age bands full-width below */}
      <div style={{ marginTop: 6 }}>
        <Section title="Age bands" items={age} />
      </div>

      <div style={{ marginTop: 10, textAlign: 'right' }}>
        <button
          onClick={onViewFilters}
          style={{
            border: '1px solid #1E3A8A',
            color: '#1E3A8A',
            background: '#fff',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer'
          }}
        >
          View in Filters tab
        </button>
      </div>
    </div>
  );
}

/**
 * Named helper used when setting Leaflet popup HTML via strings.
 * Provides the same wide/scrollable layout and two-column grid.
 */
export const CountyPopup = {
  toHTML({ mode, voter, fallback, county_id }) {
    if (mode === 'voter' && voter) {
      const enc = (s) =>
        String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const { county_desc, as_of } = voter;
      const totals = totalFrom(voter);

      const triples = (key, human) =>
        triplesFrom(voter, key, human).map(([lbl, c, p]) => [enc(lbl), c, p]);

      const sec = (title, items) => `
        <div style="margin-top:8px">
          <div style="font-weight:600;margin-bottom:4px">${title}</div>
          ${items
            .map(
              ([lbl, c, p]) => `
            <div style="margin-bottom:6px">
              <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
                <div style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${lbl}">${lbl}</div>
                <div style="min-width:56px;text-align:right">${(c?.toLocaleString?.() ?? c)}</div>
                <div style="min-width:44px;text-align:right">${p}%</div>
              </div>
              <div style="height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden">
                <div style="height:8px;width:${Math.min(100, Math.max(0, p))}%;background:#0EA5E9;border-radius:4px"></div>
              </div>
            </div>`
            )
            .join('')}
        </div>`;

      // Build two-column grid for Party/Race/Ethnicity/Gender
      const gridInner = [
        ['Party',    triples('party', PARTY_LABELS)],
        ['Race',     triples('race',  RACE_LABELS)],
        ['Ethnicity',triples('ethnicity', ETH_LABELS)],
        ['Gender',   triples('gender', GENDER_LABELS)]
      ].map(([t, items]) => sec(t, items)).join('');

      const body =
        `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px">${gridInner}</div>` +
        `<div style="margin-top:6px">${sec('Age bands', triples('age_bands', AGE_LABELS))}</div>`;

      const btnId = `vif_${county_id}_${Math.random().toString(36).slice(2)}`;
      setTimeout(() => {
        const el = document.getElementById(btnId);
        if (el)
          el.addEventListener(
            'click',
            () => {
              window.dispatchEvent(new CustomEvent('viewInFilters', { detail: county_id }));
            },
            { once: true }
          );
      }, 0);

      return `
        <div style="width:480px;max-width:min(92vw,520px);max-height:60vh;overflow-y:auto;padding:12px;font-size:12px;line-height:1.35">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px">
            <div style="font-weight:700;font-size:14px">${enc(county_desc)}</div>
            ${
              as_of
                ? `<span style="font-size:11px;background:#F8FAFC;border:1px solid #e5e7eb;border-radius:8px;padding:2px 6px">as of ${enc(as_of)}</span>`
                : ''
            }
          </div>
          <div style="margin-top:6px;font-size:13px"><strong>Total registered:</strong> ${Number(totals).toLocaleString()}</div>
          ${body}
          <div style="margin-top:10px;text-align:right">
            <button id="${btnId}" style="border:1px solid #1E3A8A;color:#1E3A8A;background:#fff;border-radius:8px;padding:6px 10px;cursor:pointer">
              View in Filters tab
            </button>
          </div>
        </div>`;
    }

    // -------- Fallback mode (base feature attributes) --------
    const enc = (s) =>
      String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const f = fallback || {};
    const link = f.NCGS_url ? `<a href="${enc(f.NCGS_url)}" target="_blank" rel="noreferrer">${enc(f.NCGS_url)}</a>` : '—';

    function row(k, v, raw = false) {
      const val = v == null || v === '' ? '—' : raw ? v : enc(String(v));
      return `<tr><th style="text-align:left;padding-right:8px">${enc(k)}</th><td>${val}</td></tr>`;
    }
    function ellipsize(s) {
      const t = String(s || '');
      return t.length > 64 ? `${enc(t.slice(0, 64))}…` : enc(t);
    }

    return `
      <div style="width:420px;max-width:min(92vw,520px);max-height:60vh;overflow-y:auto;padding:12px;font-size:12px;line-height:1.35">
        <div style="font-weight:700;font-size:14px;margin-bottom:6px">${enc(f.County || f.county_desc || 'County')}</div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <tbody>
            ${row('FIPS', f.FIPS)}
            ${row('Rec_Survey', ellipsize(f.Rec_Survey))}
            ${row('NCGS url', link, true)}
            ${row('ck_date', f.ck_date)}
            ${row('Area (mi²)', f.Area_mi_sq)}
          </tbody>
        </table>
        <div style="margin-top:10px;text-align:right">
          <button id="vif_fb_${county_id}" style="border:1px solid #1E3A8A;color:#1E3A8A;background:#fff;border-radius:8px;padding:6px 10px;cursor:pointer">
            View in Filters tab
          </button>
        </div>
      </div>
    `;
  }
};
