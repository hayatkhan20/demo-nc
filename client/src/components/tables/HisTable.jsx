import React from 'react';
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Typography } from '@mui/material';

export default function HisTable({ blocks, dimension, onClickCounty }) {
  if (!blocks?.length) return null;

  return (
    <Paper variant="outlined" sx={{ overflow: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>County</TableCell>
            <TableCell>Election</TableCell>
            <TableCell align="right">Total Ballots</TableCell>
            <TableCell>{headerFor(dimension)}</TableCell>
            <TableCell align="right">Ballots</TableCell>
            <TableCell align="right">Share %</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {blocks.map(b => (
            b.rows.length ? b.rows.map((r, idx) => (
              <TableRow key={`${b.county_id}-${idx}`} hover onClick={()=>onClickCounty?.(b.county_id)} style={{ cursor:'pointer' }}>
                <TableCell>{b.county_desc}</TableCell>
                <TableCell>{b.election_lbl}</TableCell>
                <TableCell align="right">{b.total_ballots}</TableCell>
                <TableCell>{r.label}</TableCell>
                <TableCell align="right">{r.ballots}</TableCell>
                <TableCell align="right">{r.share_pct}</TableCell>
              </TableRow>
            )) : (
              <TableRow key={`${b.county_id}-empty`}>
                <TableCell>{b.county_desc}</TableCell>
                <TableCell colSpan={5}><Typography variant="body2" color="text.secondary">No data</Typography></TableCell>
              </TableRow>
            )
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

function headerFor(dim) {
  if (dim==='methods') return 'Method';
  if (dim==='parties') return 'Party';
  return 'Precinct';
}
