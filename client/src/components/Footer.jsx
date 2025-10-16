import { Box, Typography, Link } from '@mui/material';

export default function Footer() {
  return (
    <Box component="footer" sx={{ py: 3, mt: 4, borderTop: '1px solid #e5e7eb' }}>
      <Typography variant="body2" color="text.secondary" align="center">
        © {new Date().getFullYear()} Hayat • UNC Charlotte — Data Science
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center">
        Contact: <Link href="mailto:info@example.org">info@example.org</Link>
      </Typography>
    </Box>
  );
}
