import React from 'react';
import {
  Card, CardContent, Typography, Tabs, Tab, Stack, Button, Box,
  FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, CircularProgress, TextField
} from '@mui/material';
import { usePost } from '../hooks/usePost';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const RACE   = {A:"Asian",B:"Black/African American",I:"American Indian/Alaska Native",M:"Two or more races",O:"Other",P:"NH/PI",U:"Undesignated",W:"White"};
const ETH    = {HL:"Hispanic/Latino", NL:"Not Hispanic/Not Latino", UN:"Undesignated"};
const GENDER = {M:"Male", F:"Female", U:"Undesignated"};
const PARTY  = {DEM:"Democratic", REP:"Republican", UNA:"Unaffiliated", LIB:"Libertarian", GRE:"Green", CST:"Constitution"};

const MULTI_STYLE = { maxWidth: 260 };

export default function SearchPanel({ onZoomCounty, onResults }) {
  const [mode, setMode] = React.useState('dem'); // 'dem' | 'his'
  const [counties, setCounties] = React.useState([]);
  const [countySel, setCountySel] = React.useState([]); // array of ids

  // dem filters
  const [party, setParty] = React.useState([]);
  const [race, setRace] = React.useState([]);
  const [eth, setEth] = React.useState([]);
  const [gender, setGender] = React.useState([]);
  const [ages, setAges] = React.useState([]);

  // history filters
  const [dimension, setDimension] = React.useState('methods');
  const [election, setElection] = React.useState('latest'); // string or 'latest'

  const dem = usePost(`${API_BASE}/search/demographics`);
  const his = usePost(`${API_BASE}/search/history`);

  // load available counties
  React.useEffect(() => {
    fetch(`${API_BASE}/search/counties`).then(r=>r.json()).then(setCounties).catch(console.error);
  }, []);

    // ✅ OPTIONAL: preselect a county when MapView dispatches "preselectCounty"
  React.useEffect(() => {
    const h = (e) => {
      const id = Number(e.detail);
      if (!Number.isFinite(id)) return;
      setCountySel((cur) => {
        const next = new Set(cur || []);
        next.add(id);
        return Array.from(next);
      });
      // (optional) also trigger a zoom if provided
      onZoomCounty?.(id);
    };
    window.addEventListener('preselectCounty', h);
    return () => window.removeEventListener('preselectCounty', h);
  }, [onZoomCounty]);



  const submit = async () => {
    if (mode==='dem') {
      const payload = {
        county_ids: countySel.length ? countySel : undefined,
        party, race, ethnicity: eth, gender, age_bands: ages
      };
      const data = await dem.post(payload);
      if (data) onResults?.({ mode, data });
    } else {
      const payload = {
        county_ids: countySel.length ? countySel : undefined,
        election, dimension
      };
      const data = await his.post(payload);
      if (data) onResults?.({ mode, data });
    }
  };

  const clear = () => {
    setCountySel([]);
    setParty([]); setRace([]); setEth([]); setGender([]); setAges([]);
    setElection('latest'); setDimension('methods');
    onResults?.(null);
  };

  const downloadCsv = () => {
    const payload = mode==='dem'
      ? { county_ids: countySel, party, race, ethnicity: eth, gender, age_bands: ages }
      : { county_ids: countySel, election, dimension };
    const url = new URL(`${API_BASE}/search/download.csv`);
    url.searchParams.set('mode', mode);
    url.searchParams.set('payload', JSON.stringify(payload));
    window.open(url.toString(), '_blank');
  };

  const loading = dem.loading || his.loading;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>Search</Typography>

        <Tabs value={mode} onChange={(_,v)=>setMode(v)} aria-label="Search modes">
          <Tab value="dem" label="Demographics" />
          <Tab value="his" label="Election History" />
        </Tabs>

        {/* County multi-select */}
        <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap:'wrap', alignItems:'center' }}>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel id="county-lbl">County</InputLabel>
            <Select
              labelId="county-lbl"
              multiple
              value={countySel}
              onChange={(e)=>setCountySel(e.target.value)}
              input={<OutlinedInput label="County" />}
              renderValue={(selected) => (
                <Box sx={{ display:'flex', flexWrap:'wrap', gap:0.5 }}>
                  {selected.map(v=>{
                    const c = counties.find(x=>x.county_id===v);
                    return <Chip key={v} label={c?.county_desc || v} />;
                  })}
                </Box>
              )}
            >
              {counties.map(c => (
                <MenuItem key={c.county_id} value={c.county_id}>{c.county_desc}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {mode==='dem' ? (
            <>
              <Multi label="Party"   value={party}  setValue={setParty}  map={PARTY}  />
              <Multi label="Race"    value={race}   setValue={setRace}   map={RACE}   />
              <Multi label="Ethnicity" value={eth}  setValue={setEth}    map={ETH}    />
              <Multi label="Gender"  value={gender} setValue={setGender} map={GENDER} />
              <TextField size="small" label="Age bands (comma separated)" placeholder='18–24,25–34,35–44,45–59,60+'
                value={ages.join(',')} onChange={e=>setAges(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} sx={{ minWidth: 280 }} />
            </>
          ) : (
            <>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="dimension-lbl">Dimension</InputLabel>
                <Select labelId="dimension-lbl" value={dimension} label="Dimension" onChange={e=>setDimension(e.target.value)}>
                  <MenuItem value="methods">Voting methods</MenuItem>
                  <MenuItem value="parties">Parties</MenuItem>
                  <MenuItem value="precincts">Precincts</MenuItem>
                </Select>
              </FormControl>
              <TextField size="small" label="Election label" placeholder='latest or exact label' value={election} onChange={e=>setElection(e.target.value)} sx={{ minWidth: 220 }} />
              <Button size="small" variant="outlined" onClick={()=>setElection('latest')}>Latest</Button>
            </>
          )}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={submit} disabled={loading}>
            {loading ? <CircularProgress size={18} sx={{ color:'#fff' }} /> : 'Submit'}
          </Button>
          <Button variant="text" onClick={clear}>Clear</Button>
          <Button variant="outlined" onClick={downloadCsv}>Download CSV</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function Multi({ label, value, setValue, map }) {
  const keys = Object.keys(map);
  return (
    <FormControl size="small" sx={MULTI_STYLE}>
      <InputLabel id={`${label}-lbl`}>{label}</InputLabel>
      <Select
        labelId={`${label}-lbl`} multiple value={value} onChange={(e)=>setValue(e.target.value)}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => selected.map(k=>map[k]||k).join(', ')}
      >
        {keys.map(k => <MenuItem key={k} value={k}>{map[k]}</MenuItem>)}
      </Select>
    </FormControl>
  );
}
