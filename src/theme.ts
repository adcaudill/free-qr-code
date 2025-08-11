import { createTheme } from '@mui/material/styles';

export const buildTheme = (mode: 'light' | 'dark') => createTheme({
    palette: {
        mode,
        primary: {
            main: mode === 'light' ? '#1976d2' : '#90caf9'
        },
        background: {
            default: mode === 'light' ? '#fafafa' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e'
        }
    },
    shape: { borderRadius: 10 }
});
