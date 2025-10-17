const API = import.meta.env.VITE_API_BASE_URL;

export async function getBasemapConfig() {
  const r = await fetch(`${API}/map/basemap-config`);
  if (!r.ok) throw new Error('Basemap config failed');
  return r.json();
}

export const endpoints = {
  counties:  `${API}/data/counties`,
  precincts: `${API}/data/precincts`,
  house:     `${API}/data/house`,
  senate:    `${API}/data/senate`,
  congress:  `${API}/data/congress`
};

export const tsEndpoint = (group, year) => `${API}/timeseries/${group}/${year}`;

export const YEARS = {
  congress: ['2016', '2022', 'ref'], // 'ref' = alt proposal
  house: ['2017', '2018', '2019', '2022'],
  senate: ['2017', '2018', '2021', '2022']
};
