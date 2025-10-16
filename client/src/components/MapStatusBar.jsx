import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

export default function MapStatusBar({ map }) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!map) return;
    const onMove = (e) => {
      const { lat, lng } = e.latlng || map.getCenter();
      setCoords({ lat, lng, zoom: map.getZoom() });
    };
    map.on('mousemove', onMove);
    map.on('zoomend', onMove);
    onMove({});
    return () => {
      map.off('mousemove', onMove);
      map.off('zoomend', onMove);
    };
  }, [map]);

  return (
    <Box sx={{ mt: 1, p: 1, border: '1px solid #e5e7eb', borderRadius: 1 }}>
      <Typography variant="caption">
        {coords ? `Lat: ${coords.lat.toFixed(4)}  Lng: ${coords.lng.toFixed(4)}  •  Zoom: ${coords.zoom}` : '—'}
      </Typography>
    </Box>
  );
}
