// client/src/components/MapStyles.js
export const LAYER_STYLES = {
  counties:  { color: '#0F172A', weight: 1, fillColor: '#60A5FA', fillOpacity: 0.15 }, // dark stroke, light fill
  precincts: { color: '#1E40AF', weight: 0.8, fillColor: '#0EA5E9', fillOpacity: 0.10 },
  house:     { color: '#16A34A', weight: 1.2, dashArray: '4 2', fillOpacity: 0 },
  senate:    { color: '#EA580C', weight: 1.2, dashArray: '1 4', fillOpacity: 0 },
  congress:  { color: '#9333EA', weight: 1.2, dashArray: '6 3', fillOpacity: 0 }
};

export const HOVER_STYLE = (base) => ({ ...base, weight: (base.weight || 1) + 1.2, fillOpacity: Math.min((base.fillOpacity || 0) + 0.15, 0.4) });

export const LEGEND_META = {
  counties:  { label: 'Counties',  color: LAYER_STYLES.counties.color },
  precincts: { label: 'Precincts', color: LAYER_STYLES.precincts.color },
  house:     { label: 'State House', color: LAYER_STYLES.house.color },
  senate:    { label: 'State Senate', color: LAYER_STYLES.senate.color },
  congress:  { label: 'U.S. Congress', color: LAYER_STYLES.congress.color }
};
