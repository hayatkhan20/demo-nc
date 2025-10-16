// MapView.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, Box, CircularProgress } from '@mui/material';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getBasemapConfig } from '../lib/api';
import { LayerGeoJSON } from './MapOverlays';
import { tsEndpoint } from '../lib/api';
import { TimeSeriesSingle, TimeSeriesCompare } from './TimeSeriesLayers';
import MapStatusBar from './MapStatusBar';
import { useCountyDemographics } from './hooks/useCountyDemographics';
import { CountyPopup } from './CountyPopup';

export default function MapView({ mode, layers, setLayers, ts, setActiveLegendKeys, onSwitchToFilters }) {
  const [cfg, setCfg] = useState(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const dem = useCountyDemographics();

  // Load basemap config first; gate overlays on base availability
  useEffect(() => { getBasemapConfig().then(setCfg).catch(console.error); }, []);
  const base = useMemo(() => cfg?.basemaps?.find(b => b.id === cfg?.defaultId) || null, [cfg]);

  // Keep legend keys aligned with visible overlays (Base tab)
  useEffect(() => {
    if (mode !== 'base') return;
    const actives = Object.entries(layers).filter(([,v])=>v.visible).map(([k])=>k);
    setActiveLegendKeys(actives);
  }, [mode, layers, setActiveLegendKeys]);

  // County click → demographics popup
  let lastHighlighted = null;
  
  const handleCountyClick = async (feature, latlng, layer) => {
  const props = feature?.properties || {};
  const county_id = props.county_id ?? props.County_ID ?? props.countyId ?? null;
  console.log('👉 handleCountyClick fired', { county_id, latlng });

  if (!county_id) {
    console.warn('⚠️ No county_id on feature', feature);
    return;
  }

  // highlight the selected county polygon
  try {
    if (lastHighlighted && lastHighlighted !== layer) {
      lastHighlighted.setStyle({ weight: 2 }); // reset previous
    }
    layer.setStyle({ weight: 4 });
    lastHighlighted = layer;
  } catch (e) {
    console.warn('Highlight setStyle error:', e);
  }

  // Always show a stub popup immediately so we know the popup path is working
  try {
    const map = layer?._map || mapRef.current;
    if (!map) {
      console.warn('⚠️ No Leaflet map instance (layer._map and mapRef.current both missing)');
      return;
    }

    if (!popupRef.current) {
       popupRef.current = L.popup({
   maxWidth: 520,
   className: 'county-popup',
   autoPan: true,
   autoPanPadding: [24, 24]
});
    }

    popupRef.current
      .setLatLng(latlng)
      .setContent('<div style="padding:8px"><em>Loading demographics…</em></div>')
      .openOn(map);

    console.log('🟢 Popup opened with loading stub');
  } catch (e) {
    console.error('❌ Failed to open popup:', e);
    return;
  }

  // Try to load voter demographics (Phase 7 flow)
  let html;
  try {
    // dem is from useCountyDemographics()
    console.log('dem.ready:', dem?.ready, 'available?', dem?.hasVoterData?.(county_id));

    let voter = null;
    if (dem?.ready && dem?.hasVoterData?.(county_id)) {
      voter = await dem.load(county_id);
      console.log('Fetched voter:', voter);
    } else {
      console.log('No voter data mapped (using fallback props only)');
    }

    if (voter) {
      html = CountyPopup.toHTML({ mode: 'voter', voter, county_id });
    } else {
      html = CountyPopup.toHTML({ mode: 'fallback', fallback: props, county_id });
    }
  } catch (e) {
    console.warn('Fetch/HTML build error, showing fallback:', e);
    html = CountyPopup.toHTML({ mode: 'fallback', fallback: props, county_id });
  }

  // Update the popup with final HTML
  try {
    const map = lastHighlighted?._map || layer?._map || mapRef.current;
    if (!map) {
      console.warn('⚠️ Missing map when setting final popup content');
      return;
    }
    popupRef.current.setLatLng(latlng).setContent(html).openOn(map);
    console.log('🟢 Popup updated with final content');
  } catch (e) {
    console.error('❌ Failed to set final popup content:', e);
  }
};

  // Listen for "View in Filters tab" from popup
  useEffect(() => {
    const h = (e) => onSwitchToFilters?.(e.detail);
    window.addEventListener('viewInFilters', h);
    return () => window.removeEventListener('viewInFilters', h);
  }, [onSwitchToFilters]);

  // Loading gate for basemap config
  if (!base) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 4, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <CircularProgress size={24} sx={{ mr: 1 }} /> Loading map…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 0 }}>
        <MapContainer
          center={[35.6, -79.5]}
          zoom={7}
          minZoom={base.minZoom ?? 2}
          maxZoom={base.maxZoom ?? 19}
          style={{ height: 640, width: '100%' }}
          whenCreated={(m)=> (mapRef.current = m)}
          aria-label="Interactive map of North Carolina"
        >
          <TileLayer url={base.url} attribution={base.attribution} />

          {/* Base overlays: only render after base is defined */}
          {mode === 'base' && Object.keys(layers).map((k) => (
            <LayerGeoJSON
              key={k}
              layerKey={k}
              visible={layers[k].visible}
              onLoadedBounds={() => {}}
              onFeatureClick={k === 'counties' ? handleCountyClick : undefined}
            />
          ))}

          {/* Time series overlays */}
          {mode === 'timeseries' && (
            ts.compare ? (
              <TimeSeriesCompare
                group={ts.group}
                yearA={ts.yearA} urlA={tsEndpoint(ts.group, ts.yearA)}
                yearB={ts.yearB} urlB={tsEndpoint(ts.group, ts.yearB)}
                opacity={ts.opacity}
              />
            ) : (
              <TimeSeriesSingle
                group={ts.group}
                year={ts.singleYear}
                url={tsEndpoint(ts.group, ts.singleYear)}
                fitOnLoad={true}
              />
            )
          )}
        </MapContainer>

        <Box sx={{ p: 1 }}>
          <MapStatusBar map={mapRef.current} />
        </Box>
      </CardContent>
    </Card>
  );
}
