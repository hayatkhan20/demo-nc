import React, { useEffect, useMemo, useState } from 'react';
import {
  Card, CardContent, Stack, FormControl, InputLabel, Select, MenuItem,
  Checkbox, ListItemText, Button, Switch, FormControlLabel, CircularProgress, Typography, OutlinedInput
} from '@mui/material';
import ResultsTable from '../shared/ResultsTable';

const API = import.meta.env.VITE_API_BASE_URL;

const MAJOR_TYPES = [
  { key: 'party', label: 'Party' },
  { key: 'method', label: 'Voting Method' },
  { key: 'total', label: 'Total Ballots' },
];

const PARTY = {DEM:'Democratic', REP:'Republican', UNA:'Unaffiliated', LIB:'Libertarian', GRE:'Green', CST:'Constitution'};

export default function HisFilterForm() {
  const [counties, setCounties] = useState([]); // [{county_id, county_desc, elections:[...]}]
  const [countyId, setCountyId] = useState('');
  const [useLatest, setUseLatest] = useState(true);
  const [elections, setElections] = useState([]);
  const [electionLbl, setElectionLbl] = useState('');
  const [major, setMajor] = useState('party');
  const [subgroups, setSubgroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`${API}/his/available`).then(r=>r.json()).then(j=>{
      setCounties(j.counties || []);
    }).catch(()=>setCounties([]));
  }, []);

  // Update elections when county changes
  useEffect(() => {
    const c = counties.find(x=>x.county_id === countyId);
    const list = c?.elections || [];
    setElections(list);
    setElectionLbl(list[0] || '');
  }, [countyId, counties]);

  const subgroupOpts = useMemo(() => {
    if (major === 'party') return Object.entries(PARTY).map(([k,v])=>({k,v}));
    if (major === 'method') return [
      'EARLY VOTING IN-PERSON','ABSENTEE BY MAIL','ELECTION DAY','PROVISIONAL','TRANSFER'
    ].map(m => ({k:m, v:m}));
    return [];
  }, [major]);

  const onApply = async () => {
    if (!countyId || !major) return;
    setLoading(true); setRows(null);
    try {
      const params = new URLSearchParams();
      params.set('county_id', countyId);
      params.set('type', major);
      if (useLatest) params.set('latest', 'true');
      else if (electionLbl) params.set('election_lbl', electionLbl);
      subgroups.forEach(s => params.append('subgroups', s));
      const r = await fetch(`${API}/his/filter?${params.toString()}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error?.message || `HTTP ${r.status}`);

      const totalB = +j.total_ballots || 0;
      const table = (j.rows || []).map(row => ({
        label: row.label,
        value: +row.ballots,
        pct: totalB>0 ? +( (row.ballots/totalB)*100 ).toFixed(1) : 0
      }));
      setTotal(totalB);
      setRows(table);
    } catch (e) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => { setCountyId(''); setUseLatest(true); setElectionLbl(''); setMajor('party'); setSubgroups([]); setRows(null); setTotal(0); };

  const exportCsv = () => {
    if (!rows) return;
    const header = `${major === 'party' ? 'Party' : major === 'method' ? 'Method' : 'Total'},Ballots,% of Total\n`;
    const body = rows.map(r => `${csv(r.label)},${r.value},${r.pct}`).join('\n');
    download(`ncvhis_${countyId}_${useLatest?'latest':electionLbl}_${major}.csv`, header + body);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>Election History (NCVHIS)</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Summarize ballots by party or voting method for a chosen election; or just view total ballots.
        </Typography>

        <Stack spacing={2}>
          <FormControl size="small">
            <InputLabel id="h-county">Select County</InputLabel>
            <Select labelId="h-county" value={countyId} label="Select County" onChange={(e)=>setCountyId(e.target.value)}>
              {counties.map(c => <MenuItem key={c.county_id} value={c.county_id}>{c.county_desc}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Switch checked={useLatest} onChange={(e)=>setUseLatest(e.target.checked)} />}
            label="Use Latest Election"
          />

          <FormControl size="small" disabled={useLatest}>
            <InputLabel id="h-elect">Election Date</InputLabel>
            <Select labelId="h-elect" value={electionLbl} label="Election Date" onChange={(e)=>setElectionLbl(e.target.value)}>
              {elections.map(lbl => <MenuItem key={lbl} value={lbl}>{lbl}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small">
            <InputLabel id="h-type">Select Major Type</InputLabel>
            <Select labelId="h-type" value={major} label="Select Major Type" onChange={(e)=>{ setMajor(e.target.value); setSubgroups([]); }}>
              {MAJOR_TYPES.map(t => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>

          {(major === 'party' || major === 'method') && (
            <FormControl size="small">
              <InputLabel id="h-sg">Sub-categories</InputLabel>
              <Select
                labelId="h-sg" multiple value={subgroups}
                onChange={(e)=>setSubgroups(e.target.value)}
                input={<OutlinedInput label="Sub-categories" />}
                renderValue={(selected)=>selected.join(', ')}
              >
                {subgroupOpts.map(opt => (
                  <MenuItem key={opt.k} value={opt.k}>
                    <Checkbox checked={subgroups.indexOf(opt.k) > -1} />
                    <ListItemText primary={opt.v} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={onApply} disabled={loading}>
              {loading ? <CircularProgress size={18} sx={{ color:'#fff' }} /> : 'Apply Filter'}
            </Button>
            <Button variant="text" onClick={onReset}>Reset</Button>
            <Button variant="outlined" onClick={exportCsv} disabled={!rows?.length}>Export CSV</Button>
          </Stack>

          <ResultsTable
            title={countyId ? `Results — Total Ballots: ${total.toLocaleString()}` : 'Results'}
            rows={rows}
            emptyMessage="No records found for the selected parameters."
            loading={loading}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

function csv(s){ const str=String(s??''); return /[,"\n]/.test(str) ? `"${str.replace(/"/g,'""')}"` : str; }
function download(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
