import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/team', label: 'Team' },
  { to: '/geoportal', label: 'Geoportal' },
  { to: '/contact', label: 'Contact' }
];

export default function NavBar() {
  const { pathname } = useLocation();
  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" component={Link} to="/" sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 700 }}>
          NC Elections Lab
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Box role="navigation" aria-label="Primary">
          {tabs.map(t => (
            <Button
              key={t.to}
              component={Link}
              to={t.to}
              color="inherit"
              variant={pathname === t.to ? 'outlined' : 'text'}
              sx={{ mx: 0.5 }}
            >
              {t.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
