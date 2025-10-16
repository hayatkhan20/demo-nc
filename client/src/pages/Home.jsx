import { Box, Typography, Button, Stack, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <Box>
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h1" sx={{ mb: 2 }}>Transparent Elections, Clear Data</Typography>
        <Typography variant="body1" sx={{ mb: 3, maxWidth: 720, mx: 'auto' }}>
          A professional MVP to explore North Carolina’s election administration with modern mapping and open data.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" color="primary" component={Link} to="/geoportal">Open Geoportal</Button>
          <Button variant="outlined" color="secondary" component={Link} to="/about">Learn More</Button>
        </Stack>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {[
          { title: 'Geospatial Foundation', body: 'Leaflet-powered map workspace with professional UI.' },
          { title: 'Backend Proxy', body: 'All data fetched via Express with caching and CORS hardening.' },
          { title: 'Phased Roadmap', body: 'Layers & popups → Time series → Filters & downloads.' }
        ].map((c) => (
          <Card key={c.title} variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6">{c.title}</Typography>
              <Typography variant="body2" color="text.secondary">{c.body}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
