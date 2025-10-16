import React, { useEffect, useMemo, useState } from 'react';
import {
  Card, CardContent, Stack, FormControl, InputLabel, Select, MenuItem,
  OutlinedInput, Checkbox, ListItemText, Button, CircularProgress, Typography
} from '@mui/material';
import ResultsTable from '../shared/ResultsTable';

const API = import.meta.env.VITE_API_BASE_URL;

const CATEGORY_OPTIONS = [
  { key: 'race', label: 'Race' },
  { key: 'gender', label: 'Gender' },
  { key: 'party', label: 'Party' },
  { key: 'ethnicity', label: 'Ethnicity' },
  { key: 'age_bands', label: 'Age Band' },
];

const LABELS = {
  race: {A:'Asian',B:'Black/African American',I:'American Indian/Alaska Native',M:'Two or more races',O:'Other',P:'NH/PI',U:'Undesignated',W:'White'},
  gender: {M:'Male',F:'Female',U:'Undesignated'},
  party: {DEM:'Democratic',REP:'Republican',UNA:'Unaffiliated',LIB:'Libertarian',GRE:'Green',CST:'Constitution'},
  ethnicity: {HL:'Hispanic/Latino',NL:'Not Hispanic/Not Latino',UN:'Undesignated'},
  age_bands: {'18–24':'18–24','25–34':'25–34','35–44':'35–44','45–59':'45–59','60+':'60+'}
};

export default function VoterFilterForm() {
  const [counties, setCounties] = useState([]);
  const [countyId, setCountyId] = useState('');
  const [category, setCategory] = useState('race');
  const [subgroups, setSubgroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(null);
  const [total, setTotal] = useState(0);

  // Fetch available counties (robust fallback to county_ids when counties is empty)
  useEffect(() => {
    fetch(`${API}/voter/available`)
      .then((r) => r.json())
      .then((j) => {
        const hasCounties = Array.isArray(j.counties) && j.counties.length > 0;
        const ids = Array.isArray(j.county_ids) ? j.county_ids : [];
        const list = hasCounties
          ? j.counties
          : ids.map((id) => ({ county_id: id, county_desc: `County ${id}` }));
        setCounties(list);
      })
      .catch(() => setCounties([]));
  }, []);

  const subgroupOpts = useMemo(
    () => Object.entries(LABELS[category]).map(([k, v]) => ({ k, v })),
    [category]
  );

  const onApply = async () => {
    if (!countyId || !category) return;
    setLoading(true);
    setRows(null);
    try {
      const params = new URLSearchParams();
      params.set('county_id', countyId);
      params.set('category', category);
      subgroups.forEach((s) => params.append('subgroups', s));

      const r = await fetch(`${API}/voter/filter?${params.toString()}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error?.message || `HTTP ${r.status}`);

      const totalV = +j.total || 0;
      const table = Object.entries(j.counts || {})
        .map(([code, count]) => {
          const label = LABELS[category][code] || code;
          const pct = totalV > 0 ? ((+count / totalV) * 100) : 0;
          return { label, value: +count, pct: +(pct.toFixed(1)) };
        })
        .sort((a, b) => b.value - a.value);

      setTotal(totalV);
      setRows(table);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setCountyId('');
    setCategory('race');
    setSubgroups([]);
    setRows(null);
    setTotal(0);
  };

  const exportCsv = () => {
    if (!rows) return;
    const header = 'Sub-Group,Count,% of Total\n';
    const body = rows.map((r) => `${csv(r.label)},${r.value},${r.pct}`).join('\n');
    download(`ncvoter_${countyId}_${category}.csv`, header + body);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          Demographic Summary (NCVOTER)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a county and demographic category. Optionally choose specific sub-groups to compare.
        </Typography>

        <Stack spacing={2}>
          <FormControl size="small">
            <InputLabel id="v-county">Select County</InputLabel>
            <Select
              labelId="v-county"
              value={countyId}
              label="Select County"
              onChange={(e) => setCountyId(Number(e.target.value))}
            >
              {counties.map((c) => (
                <MenuItem key={c.county_id} value={c.county_id}>
                  {c.county_desc}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel id="v-cat">Select Demographic Category</InputLabel>
            <Select
              labelId="v-cat"
              value={category}
              label="Select Demographic Category"
              onChange={(e) => {
                setCategory(e.target.value);
                setSubgroups([]);
              }}
            >
              {CATEGORY_OPTIONS.map((o) => (
                <MenuItem key={o.key} value={o.key}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel id="v-sg">Select Sub-Groups</InputLabel>
            <Select
              labelId="v-sg"
              multiple
              value={subgroups}
              onChange={(e) => setSubgroups(e.target.value)}
              input={<OutlinedInput label="Select Sub-Groups" />}
              renderValue={(selected) =>
                selected.length
                  ? selected.map((s) => LABELS[category][s] || s).join(', ')
                  : 'All'
              }
            >
              {subgroupOpts.map((opt) => (
                <MenuItem key={opt.k} value={opt.k}>
                  <Checkbox checked={subgroups.indexOf(opt.k) > -1} />
                  <ListItemText primary={opt.v} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={onApply} disabled={loading}>
              {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Apply Filter'}
            </Button>
            <Button variant="text" onClick={onReset}>
              Reset
            </Button>
            <Button variant="outlined" onClick={exportCsv} disabled={!rows?.length}>
              Export CSV
            </Button>
          </Stack>

          <ResultsTable
            title={countyId ? `Results — Total: ${total.toLocaleString()}` : 'Results'}
            rows={rows}
            emptyMessage="No records found for the selected parameters."
            loading={loading}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

function csv(s) {
  const str = String(s ?? '');
  return /[,"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
