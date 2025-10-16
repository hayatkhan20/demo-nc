// Geoportal.jsx
import { useMemo, useState } from 'react';
import { Box, Grid, Tabs, Tab } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import MapView from '../components/MapView';
import LayerPanel from '../components/panels/LayerPanel';
import TimeSeriesPanel from '../components/panels/TimeSeriesPanel';
import FilterPanel from '../components/panels/FilterPanel';
import LegendPanel from '../components/panels/LegendPanel';

const TABS = ['base','timeseries','filters'];

export default function Geoportal() {
  const [params, setParams] = useSearchParams();
  const initial = TABS.includes(params.get('tab')) ? params.get('tab') : 'base';
  const [tab, setTab] = useState(initial);
  const onTabChange = (_e, v) => { setTab(v); params.set('tab', v); setParams(params, { replace: true }); };

  // Base layers visibility
  const [layers, setLayers] = useState({
    counties:  { label: 'Counties',  visible: true },
    precincts: { label: 'Precincts', visible: false },
    house:     { label: 'State House', visible: false },
    senate:    { label: 'State Senate', visible: false },
    congress:  { label: 'U.S. Congress', visible: false }
  });

  // Time-series state
  const [ts, setTs] = useState({ group:'congress', singleYear:'2016', compare:false, yearA:'2016', yearB:'2022', opacity:0.65 });

  // Legend keys
  const [legendKeys, setLegendKeys] = useState(['counties']);

  // Right-panel content per tab
  const RightPanel = useMemo(() => {
    if (tab === 'timeseries') {
      return (
        <>
          <TimeSeriesPanel state={ts} setState={setTs} onFit={()=>{}} />
          <LegendPanel activeKeys={[ts.group]} />
        </>
      );
    }
    if (tab === 'filters') {
      // NO MAP in this tab — filters render full-width below, so no right panel
      return null;
    }
    return (
      <>
        <LayerPanel
          layers={layers}
          setLayers={setLayers}
          onZoom={(key)=>window.dispatchEvent(new CustomEvent('zoomLayer', { detail: key }))}
        />
        <LegendPanel activeKeys={legendKeys} />
      </>
    );
  }, [tab, ts, layers, legendKeys]);

  return (
    <Box>
      <Tabs value={tab} onChange={onTabChange} aria-label="Geoportal tabs" sx={{ mb: 2 }}>
        <Tab label="Base Layers" value="base" />
        <Tab label="Time Series" value="timeseries" />
        <Tab label="Filters" value="filters" />
      </Tabs>

      <Grid container spacing={2}>
        {/* Map only for Base & Time Series */}
        {(tab === 'base' || tab === 'timeseries') && (
          <Grid item xs={12} md={8} lg={9}>
            <MapView
              mode={tab}
              layers={layers}
              setLayers={setLayers}
              ts={ts}
              setActiveLegendKeys={setLegendKeys}
              onSwitchToFilters={(countyId)=>{
                setTab('filters');
                params.set('tab','filters');
                setParams(params, { replace: true });
                window.dispatchEvent(new CustomEvent('preselectCounty', { detail: countyId }));
              }}
            />
          </Grid>
        )}

        {/* Side panel */}
        <Grid item xs={12} md={4} lg={3}>
          <Box sx={{ display:'grid', gap:2 }}>
            {RightPanel}
          </Box>
        </Grid>

        {/* Filters tab: full-width content (no map) */}
        {tab === 'filters' && (
          <Grid item xs={12}>
            <FilterPanel />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
