import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import VoterFilterForm from './VoterFilterForm';
import HisFilterForm from './HisFilterForm';

export default function FilterPanel() {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>Filters</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Explore county-level demographics (NCVOTER) and election history (NCVHIS).
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <VoterFilterForm />
        </Grid>
        <Grid item xs={12} md={6}>
          <HisFilterForm />
        </Grid>
      </Grid>
    </Box>
  );
}
