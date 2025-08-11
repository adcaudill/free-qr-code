import React from 'react';
import { Container, CssBaseline, IconButton, Link, Paper, Stack, Toolbar, AppBar, Typography } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { Hero } from './components/Hero';
import { SimpleForm } from './components/SimpleForm';
import { QrPreview } from './components/QrPreview';
// Lazy-loaded heavy below-the-fold / complex configuration panels
const AdvancedOptions = React.lazy(() => import('./components/AdvancedOptions').then(m => ({ default: m.AdvancedOptions })));
const Faq = React.lazy(() => import('./components/Faq').then(m => ({ default: m.Faq })));
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from './theme';
import { defaultConfig, QrConfig } from './types';
import { buildQrData } from './utils/contentBuilders';
import { useQrCode } from './hooks/useQrCode';
import { ThemeToggle } from './components/ThemeToggle';
import { normalizeUrl } from './utils/validation';

const STORAGE_KEY = 'freeqr-theme';

export const App: React.FC = () => {
    const [mode, setMode] = React.useState<'light' | 'dark'>(() => (localStorage.getItem(STORAGE_KEY) as 'light' | 'dark') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    const [config, setConfig] = React.useState<QrConfig>({ ...defaultConfig });
    const { ref: qrRef, toPng, toSvg, isReady } = useQrCode(config);

    function patch(p: Partial<QrConfig>) {
        setConfig(c => ({ ...c, ...p }));
    }

    // Ensure text stays in sync when content changes
    React.useEffect(() => {
        setConfig(c => ({ ...c, text: buildQrData(c) }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.contentType, config.url, config.wifi, config.vcard, config.sms]);

    async function handleDownload() {
        const blob = config.format === 'png' ? await toPng() : await toSvg();
        if (!blob) return;
        const ext = config.format;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code.${ext}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function toggleTheme() {
        setMode(m => {
            const next = m === 'light' ? 'dark' : 'light';
            localStorage.setItem(STORAGE_KEY, next);
            return next;
        });
    }

    return (
        <ThemeProvider theme={buildTheme(mode)}>
            <CssBaseline />
            <AppBar position="sticky" color="transparent" elevation={0} enableColorOnDark>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={600}>Free QR</Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton component={Link} href="https://github.com/adcaudill/free-qr-code" target="_blank" rel="noopener" aria-label="GitHub repo" color="inherit" size="small">
                            <GitHubIcon fontSize="small" />
                        </IconButton>
                        <ThemeToggle mode={mode} onToggle={toggleTheme} />
                    </Stack>
                </Toolbar>
            </AppBar>
            <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
                <Hero />
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="stretch">
                    <Stack flex={1} spacing={2}>
                        <SimpleForm config={config} onPatch={patch} onDownload={handleDownload} disabled={!isReady || !config.text} />
                        <React.Suspense fallback={<Paper sx={{ p: 2 }}><Typography variant="body2">Loading advanced options…</Typography></Paper>}>
                            <AdvancedOptions config={config} onChange={patch} />
                        </React.Suspense>
                    </Stack>
                    <Paper sx={{ p: 2, flexBasis: 340, flexGrow: 0 }}>
                        <QrPreview qrRef={qrRef} ready={isReady} />
                    </Paper>
                </Stack>
                <React.Suspense fallback={<Typography mt={8} variant="body2" color="text.secondary">Loading FAQ…</Typography>}>
                    <Faq />
                </React.Suspense>
                <Typography variant="caption" display="block" textAlign="center" mt={8} color="text.secondary">
                    © {new Date().getFullYear()}
                    <Link href="https://adamcaudill.com" underline="hover" sx={{ ml: 0.5 }}>Adam Caudill</Link> |
                    <Link href="https://github.com/adcaudill/free-qr-code" underline="hover" sx={{ ml: 0.5 }}>GitHub</Link>
                </Typography>
            </Container>
        </ThemeProvider>
    );
};
