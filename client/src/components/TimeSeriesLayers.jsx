import React from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import { useGeoJson } from './hooks/useGeoJson';
import L from 'leaflet';

// base styles per group, two tones for A/B
const GROUP_STYLES = {
  congress: [{ color: '#0077FF', weight: 2, fillOpacity: 0 }, { color: '#FF7F00', weight: 2, dashArray: '6 3', fillOpacity: 0 }],
  house:    [{ color: '#00B050', weight: 2, fillOpacity: 0 }, { color: '#FF00AA', weight: 2, dashArray: '6 3', fillOpacity: 0 }],
  senate:   [{ color: '#FF3333', weight: 2, fillOpacity: 0 }, { color: '#00FFFF', weight: 2, dashArray: '6 3', fillOpacity: 0 }]
};

function PopupHTML(group, year) {
  return (props) => {
    const p = props || {};
    const row = (k, v) => (v === undefined || v === null || v === '' ? '' :
      `<tr><th style="text-align:left;padding-right:8px">${k}</th><td>${String(v)}</td></tr>`);
    // defensive property names
    const district = p.district ?? p.houseid ?? p.senateid ?? p.id ?? '—';
    return `<div style="font-size:12px;line-height:1.3">
      <strong>${group.toUpperCase()} ${year}</strong>
      <table><tbody>${row('District', district)}</tbody></table>
    </div>`;
  };
}

function Layer({ url, style, fitOnLoad, label }) {
  const map = useMap();
  const { loading, error, data, bounds } = useGeoJson(url);

  React.useEffect(() => {
    if (fitOnLoad && bounds) map.fitBounds(bounds.pad(0.05));
  }, [fitOnLoad, bounds, map]);

  if (!url) return null;
  if (loading) return <div style={badge('Loading ' + label)} />;
  if (error)   return <div style={badge('Error ' + label + ': ' + error, true)} />;

  return (
    <GeoJSON
      data={data}
      style={style}
      onEachFeature={(feat, layer) => {
        const html = PopupHTML(label.group, label.year)(feat?.properties);
        const div = L.DomUtil.create('div'); div.innerHTML = html;
        layer.on({
          mouseover: () => layer.setStyle({ ...style, weight: (style.weight || 2) + 1 }),
          mouseout:  () => layer.setStyle(style)
        });
        layer.bindPopup(div);
      }}
    />
  );
}

const badge = (text, err=false) => ({
  position: 'absolute', top: 8, left: 8, padding: '4px 8px',
  background: err ? '#fee2e2' : '#fff', border: err ? '1px solid #fecaca' : '1px solid #e5e7eb',
  borderRadius: 6, boxShadow:'0 1px 4px rgba(0,0,0,.12)', fontSize: 12
});

export function TimeSeriesSingle({ group, year, url, fitOnLoad }) {
  const style = GROUP_STYLES[group]?.[0] || { color:'#111827', weight:2, fillOpacity:0 };
  return <Layer url={url} style={style} fitOnLoad={fitOnLoad} label={{ group, year }} />;
}

export function TimeSeriesCompare({ group, yearA, urlA, yearB, urlB, opacity=0.65 }) {
  const sA = GROUP_STYLES[group]?.[0] || { color:'#111827', weight:2, fillOpacity:0 };
  const sB = GROUP_STYLES[group]?.[1] || { color:'#9CA3AF', weight:2, dashArray:'6 3', fillOpacity:0 };
  // B as overlay with adjustable opacity (stroke alpha via CSS opacity)
  const styleB = { ...sB, opacity };

  return (
    <>
      <Layer url={urlA} style={sA} fitOnLoad={true}  label={{ group, year: yearA }} />
      <Layer url={urlB} style={styleB} fitOnLoad={false} label={{ group, year: yearB }} />
    </>
  );
}
