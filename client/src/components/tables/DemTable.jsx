import React from 'react';
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Typography } from '@mui/material';

export default function DemTable({ rows, aggregate, onClickCounty }) {
  if (!rows?.length) return null;

  const cols = [
    { key: 'county_desc', label: 'County' },
    { key: 'total_all', label: 'Total' },
    { key: 'subtotal', label: 'Filtered Total' },
  ];

  const bucketCols = (bucket, labels) =>
    Object.keys(bucket?.counts || {}).map(k => ({
      key: `${bucket}.${k}`,
      label: (labels?.[k] || k),
      render: (r) => r[bucket]?.counts?.[k] ?? 0,
      pct:    (r) => r[bucket]?.pct?.[k] ?? 0
    }));

  // infer columns from first row
  const r0 = rows[0];
  const dynCols = [
    ...bucketCols('party', r0?.party?.labels),
    ...bucketCols('race', r0?.race?.labels),
    ...bucketCols('ethnicity', r0?.ethnicity?.labels),
    ...bucketCols('gender', r0?.gender?.labels),
    ...bucketCols('age_bands')
  ];

  const render = (r) => (
    <TableRow key={r.county_id} hover onClick={()=>onClickCounty?.(r.county_id)} style={{ cursor:'pointer' }}>
      <TableCell>{r.county_desc}</TableCell>
      <TableCell>{r.totals.total_all}</TableCell>
      <TableCell>{r.totals.subtotal}</TableCell>
      {dynCols.map(c => (
        <TableCell key={c.key} title={`${c.label} (${c.pct(r)}%)`}>
          {c.render(r)} <Typography component="span" variant="caption" color="text.secondary">({c.pct(r)}%)</Typography>
        </TableCell>
      ))}
    </TableRow>
  );

  return (
    <Paper variant="outlined" sx={{ overflow: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {cols.map(c => <TableCell key={c.key}>{c.label}</TableCell>)}
            {dynCols.map(c => <TableCell key={c.key}>{c.label}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(render)}
          {aggregate && render(aggregate)}
        </TableBody>
      </Table>
    </Paper>
  );
}
