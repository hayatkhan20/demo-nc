import { Outlet, useLocation } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import AppRoutes from './routes';

export default function AppShell() {
  const location = useLocation();
  return (
    <Box display="flex" minHeight="100vh" flexDirection="column">
      <NavBar />
      <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        {/* Route outlet */}
        <AppRoutes key={location.pathname} />
        <Outlet />
      </Container>
      <Footer />
    </Box>
  );
}
