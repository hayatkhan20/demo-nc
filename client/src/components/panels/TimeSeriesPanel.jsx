import React from 'react';
import { Card, CardContent, Typography, Tabs, Tab, FormControlLabel, Switch, Stack, Select, MenuItem, Slider, Box, Button } from '@mui/material';
import { YEARS } from '../../lib/api';

const GROUPS = ['congress', 'house', 'senate'];

export default function TimeSeriesPanel({ state, setState, onFit }) {
  const { group, singleYear, compare, yearA, yearB, opacity } = state;

  const setGroup = (_, g) => setState(s => ({ ...s, group: g }));
  const setSingleYear = (e) => setState(s => ({ ...s, singleYear: e.target.value, yearA: e.target.value }));
  const setCompare = (e) => setState(s => ({ ...s, compare: e.target.checked }));
  const setYearA = (e) => setState(s => ({ ...s, yearA: e.target.value }));
  const setYearB = (e) => setState(s => ({ ...s, yearB: e.target.value }));
  const setOpacity = (_, v) => setState(s => ({ ...s, opacity: v }));

  const years = YEARS[group];

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>Districts Time Series</Typography>

        <Tabs value={group} onChange={setGroup} variant="fullWidth" aria-label="Time series groups">
          {GROUPS.map(g => <Tab key={g} value={g} label={label(g)} />)}
        </Tabs>

        {!compare ? (
          <Stack direction="row" spacing={2} sx={{ mt: 2, alignItems: 'center' }}>
            <Select size="small" value={singleYear} onChange={setSingleYear} aria-label="Select year">
              {years.map(y => <MenuItem key={y} value={y}>{y.toUpperCase()}</MenuItem>)}
            </Select>
            <Button variant="outlined" size="small" onClick={onFit}>Fit to layer</Button>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Select size="small" value={yearA} onChange={setYearA} aria-label="Year A">
                {years.map(y => <MenuItem key={y} value={y}>{y.toUpperCase()}</MenuItem>)}
              </Select>
              <Select size="small" value={yearB} onChange={setYearB} aria-label="Year B">
                {years.map(y => <MenuItem key={y} value={y}>{y.toUpperCase()}</MenuItem>)}
              </Select>
              <Button variant="outlined" size="small" onClick={onFit}>Fit</Button>
            </Stack>
            <Box>
              <Typography variant="caption">Overlay opacity (Year B)</Typography>
              <Slider size="small" value={opacity} min={0.2} max={1} step={0.05} onChange={setOpacity} />
            </Box>
          </Stack>
        )}

        <FormControlLabel
          sx={{ mt: 1 }}
          control={<Switch checked={compare} onChange={setCompare} />}
          label="Compare two years"
        />
      </CardContent>
    </Card>
  );
}

function label(g) {
  if (g === 'congress') return 'Congress';
  if (g === 'house') return 'State House';
  if (g === 'senate') return 'State Senate';
  return g;
}
