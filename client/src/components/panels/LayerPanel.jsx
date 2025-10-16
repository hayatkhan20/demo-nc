// client/src/components/panels/LayerPanel.jsx  (NEW)
import { Card, CardContent, Typography, FormGroup, FormControlLabel, Switch, Button, Stack } from '@mui/material';

export default function LayerPanel({ layers, setLayers, onZoom }) {
  const toggle = (key) => (e) => setLayers((s) => ({ ...s, [key]: { ...s[key], visible: e.target.checked } }));

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>Layers</Typography>
        <FormGroup>
          {Object.entries(layers).map(([key, cfg]) => (
            <FormControlLabel
              key={key}
              control={<Switch checked={cfg.visible} onChange={toggle(key)} inputProps={{ 'aria-label': `Toggle ${cfg.label}` }} />}
              label={cfg.label}
            />
          ))}
        </FormGroup>
        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
          {Object.entries(layers).map(([key, cfg]) => (
            <Button key={key} size="small" variant="outlined" onClick={() => onZoom(key)} disabled={!cfg.visible}>
              Zoom {cfg.short ?? cfg.label}
            </Button>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
