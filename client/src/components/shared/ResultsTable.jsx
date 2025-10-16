import React from 'react';
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Typography, Skeleton } from '@mui/material';

export default function ResultsTable({ title, rows, emptyMessage, loading }) {
  return (
    <Paper variant="outlined" sx={{ mt: 1, overflow: 'auto' }}>
      <Typography variant="subtitle2" sx={{ p: 1.5 }}>{title || 'Results'}</Typography>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Sub-Group</TableCell>
            <TableCell align="right">Count</TableCell>
            <TableCell align="right">% of Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && Array.from({length:5}).map((_,i)=>(
            <TableRow key={i}>
              <TableCell><Skeleton width={160} /></TableCell>
              <TableCell align="right"><Skeleton width={60} /></TableCell>
              <TableCell align="right"><Skeleton width={60} /></TableCell>
            </TableRow>
          ))}
          {!loading && (!rows || rows.length===0) && (
            <TableRow><TableCell colSpan={3}>
              <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>{emptyMessage || 'No data'}</Typography>
            </TableCell></TableRow>
          )}
          {!loading && rows?.map((r, idx)=>(
            <TableRow key={idx}>
              <TableCell>{r.label}</TableCell>
              <TableCell align="right">{r.value?.toLocaleString?.() ?? r.value}</TableCell>
              <TableCell align="right">{r.pct}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
