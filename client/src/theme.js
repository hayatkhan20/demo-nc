import { createTheme } from '@mui/material/styles';

// Palette per spec
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1E3A8A' }, // Indigo 800
    secondary: { main: '#0EA5E9' }, // Sky 500
    success: { main: '#22C55E' },   // Emerald 500
    background: { default: '#F8FAFC', paper: '#FFFFFF' }, // Slate 50
    text: { primary: '#0F172A' }     // Slate 900
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'].join(','),
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.5rem', fontWeight: 700 },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    body1: { fontSize: '1rem', lineHeight: 1.6 }
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', borderRadius: 12 } }
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 16 } }
    },
    MuiLink: {
      defaultProps: { underline: 'hover' }
    }
  }
});
