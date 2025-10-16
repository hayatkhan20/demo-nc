// client/src/components/panels/LegendPanel.jsx  (UPDATED)
import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import { LEGEND_META } from '../MapStyles';

export default function LegendPanel({ activeKeys }) {
  const items = activeKeys.map(k => ({ key: k, ...LEGEND_META[k] })).filter(Boolean);
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>Legend</Typography>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Toggle a layer to see its legend.</Typography>
        ) : (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {items.map(({ key, label, color }) => (
              <Chip key={key} label={label} variant="outlined" sx={{ borderColor: color, color }} />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
