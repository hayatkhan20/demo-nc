import { Typography, Box } from '@mui/material';
export default function About() {
  return (
    <Box>
      <Typography variant="h2" sx={{ mb: 2 }}>About the Project</Typography>
      <Typography variant="body1">
        This MVP showcases a research-grade web stack designed to visualize and explore North Carolina’s election administration.
        It is built for clarity, accessibility, and future extensibility.
      </Typography>
    </Box>
  );
}
