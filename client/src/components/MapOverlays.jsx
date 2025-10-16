// MapOverlays.jsx
import React, { useEffect, useRef, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { endpoints } from '../lib/api';
import { LAYER_STYLES, HOVER_STYLE } from './MapStyles';

// Keep URLs explicit and stable
const URLS = {
  counties: endpoints.counties,
  precincts: endpoints.precincts,
  house: endpoints.house,
  senate: endpoints.senate,
  congress: endpoints.congress
};

/**
 * LayerGeoJSON
 * - Re-enabled <GeoJSON/> (it was commented/missing).
 * - Honors `visible`.
 * - Calls `onLoadedBounds(bounds)` after first render.
 * - Optional `onFeatureClick(feature, latlng)` (used for Counties → demographics popup).
 */
export function LayerGeoJSON({ layerKey, visible, onLoadedBounds, onFeatureClick }) {
  const map = useMap();
  const layerRef = useRef(null);
  const [state, setState] = useState({ loading: false, error: null, data: null });
  const url = URLS[layerKey];
  const baseStyle = LAYER_STYLES[layerKey];

  // lazy-load when visible
  useEffect(() => {
    let aborted = false;
    async function load() {
      if (!visible || state.data || !url) return;
      try {
        setState(s => ({ ...s, loading: true, error: null }));
        const r = await fetch(url, { headers: { Accept: 'application/geo+json' } });
        if (!r.ok) throw new Error(`Fetch failed (${r.status})`);
        const gj = await r.json();
        if (!aborted) setState({ loading: false, error: null, data: gj });
      } catch (e) {
        if (!aborted) setState({ loading: false, error: e.message, data: null });
      }
    }
    load();
    return () => { aborted = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, url]);

  // onEachFeature: hover highlight; generic popups for non-counties; county click handed off
  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: () => layer.setStyle(HOVER_STYLE(baseStyle)),
      mouseout: () => layer.setStyle(baseStyle),
    });

    if (layerKey !== 'counties') {
      // small default popup (Phase 2 behavior)
      const props = feature?.properties || {};
      const div = L.DomUtil.create('div');
      div.innerHTML = `<div style="font-size:12px">${Object.entries(props)
        .slice(0, 6)
        .map(([k, v]) => `<div><strong>${k}</strong>: ${String(v)}</div>`)
        .join('')}</div>`;
      layer.bindPopup(div);
    } else if (typeof onFeatureClick === 'function') {
      layer.on('click', (e) => {
    console.log('🟢 County clicked:', feature?.properties?.county_desc || feature?.properties?.County || feature);
    onFeatureClick(feature, e.latlng, layer); // pass layer for highlight
  });
    }
  };

  // fitBounds once after data is drawn
  useEffect(() => {
    if (!visible || !layerRef.current) return;
    const b = layerRef.current.getBounds?.();
    if (b && b.isValid() && typeof onLoadedBounds === 'function') onLoadedBounds(b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, state.data]);

  if (!visible) return null;
  if (state.loading) {
    return (
      <div aria-live="polite" style={{
        position:'absolute', top:8, left:8, background:'#fff', padding:'4px 8px',
        borderRadius:6, boxShadow:'0 1px 4px rgba(0,0,0,.12)', fontSize:12
      }}>Loading {layerKey}…</div>
    );
  }
  if (state.error) {
    return (
      <div role="alert" style={{
        position:'absolute', top:8, left:8, background:'#fee2e2', padding:'4px 8px',
        borderRadius:6, border:'1px solid #fecaca', fontSize:12
      }}>Error: {state.error}</div>
    );
  }
  if (!state.data) return null;

  return (
    <GeoJSON
      data={state.data}
      ref={layerRef}
      style={() => baseStyle}
      onEachFeature={onEachFeature}
      interactive={true}
      // NOTE: do NOT set a custom pane unless you've created it. We keep defaults to avoid appendChild errors.
    />
  );
}
