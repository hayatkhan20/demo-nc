import { Typography, Box, TextField, Button, Stack } from '@mui/material';
export default function Contact() {
  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 2 }}>Contact</Typography>
      <Stack spacing={2} component="form" onSubmit={(e) => e.preventDefault()} sx={{ maxWidth: 480 }}>
        <TextField label="Name" required />
        <TextField label="Email" type="email" required />
        <TextField label="Message" multiline minRows={4} required />
        <Button variant="contained" type="submit">Send</Button>
      </Stack>
    </Box>
  );
}
