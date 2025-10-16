import { Card, CardContent, Typography } from '@mui/material';

export default function DownloadPanel() {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">Downloads</Typography>
        <Typography variant="body2" color="text.secondary">
          Export current selection as GeoJSON/CSV (Phase 4).
        </Typography>
      </CardContent>
    </Card>
  );
}
