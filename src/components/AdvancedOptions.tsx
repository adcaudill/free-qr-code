import React, { useCallback } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Slider, TextField, Typography, MenuItem, Alert, Stack, Chip, Button, FormControlLabel, Switch } from '@mui/material';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { QrConfig } from '../types';
import { assessScanability } from '../utils/scanQuality';
import { LogoUploader } from './LogoUploader';

interface Props {
    config: QrConfig;
    onChange: (patch: Partial<QrConfig>) => void;
}

export const AdvancedOptions: React.FC<Props> = ({ config, onChange }) => {
    const assessment = assessScanability({
        foreground: config.foreground,
        background: config.background,
        errorCorrection: config.errorCorrection,
        logoSizeRatio: config.logoSizeRatio,
        margin: config.margin
    });

    const autoFix = useCallback(() => {
        const patch = autoFixLogic(config);
        if (Object.keys(patch).length) onChange(patch);
    }, [config, onChange]);

    return (
        <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>Advanced Options</AccordionSummary>
            <AccordionDetails>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField select fullWidth label="Error Correction" value={config.errorCorrection} onChange={e => onChange({ errorCorrection: e.target.value as QrConfig['errorCorrection'] })} size="small">
                            {['L', 'M', 'Q', 'H'].map(l => <MenuItem value={l} key={l}>{l}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField type="number" label="Size (px)" value={config.size} onChange={e => onChange({ size: clamp(+e.target.value, 128, 1024) })} size="small" fullWidth InputProps={{ inputProps: { min: 128, max: 1024 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField type="number" label="Margin" value={config.margin} onChange={e => onChange({ margin: clamp(+e.target.value, 0, 32) })} size="small" fullWidth InputProps={{ inputProps: { min: 0, max: 32 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField type="color" label="Foreground" aria-label="Foreground color" value={config.foreground} onChange={e => onChange({ foreground: e.target.value })} size="small" fullWidth InputLabelProps={{ shrink: true }} inputProps={{ style: { padding: 2 } }} sx={{ '& input[type=color]:focus-visible': { outline: '2px solid', outlineOffset: 2 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField type="color" label="Background" aria-label="Background color" value={config.background} onChange={e => onChange({ background: e.target.value })} size="small" fullWidth InputLabelProps={{ shrink: true }} inputProps={{ style: { padding: 2 } }} sx={{ '& input[type=color]:focus-visible': { outline: '2px solid', outlineOffset: 2 } }} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField select fullWidth label="Dot Style" value={config.dotStyle} onChange={e => onChange({ dotStyle: e.target.value as any })} size="small">
                            {['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField select fullWidth label="Corner Squares" value={config.cornerSquareStyle} onChange={e => onChange({ cornerSquareStyle: e.target.value as any })} size="small">
                            {['square', 'extra-rounded'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField select fullWidth label="Corner Dots" value={config.cornerDotStyle} onChange={e => onChange({ cornerDotStyle: e.target.value as any })} size="small">
                            {['dot', 'square'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel control={<Switch checked={config.useGradient} onChange={e => onChange({ useGradient: e.target.checked })} />} label="Gradient" />
                    </Grid>
                    {config.useGradient && (
                        <>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                <TextField type="color" label="2nd Color" aria-label="Gradient second color" value={config.gradientColor} onChange={e => onChange({ gradientColor: e.target.value })} size="small" fullWidth InputLabelProps={{ shrink: true }} inputProps={{ style: { padding: 2 } }} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                <TextField select fullWidth label="Gradient Type" value={config.gradientType} onChange={e => onChange({ gradientType: e.target.value as any })} size="small">
                                    <MenuItem value="linear">Linear</MenuItem>
                                    <MenuItem value="radial">Radial</MenuItem>
                                </TextField>
                            </Grid>
                            {config.gradientType === 'linear' && (
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                    <Typography variant="caption" gutterBottom>Rotation</Typography>
                                    <Slider size="small" value={config.gradientRotation} onChange={(_, v) => onChange({ gradientRotation: v as number })} min={0} max={360} />
                                </Grid>
                            )}
                        </>
                    )}
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" display="block" gutterBottom>Logo (drag & drop + crop)</Typography>
                        <LogoUploader config={config} onChange={onChange} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography variant="caption" gutterBottom>Logo Size</Typography>
                        <Slider size="small" value={Math.round(config.logoSizeRatio * 100)} onChange={(_, v) => onChange({ logoSizeRatio: (v as number) / 100 })} min={5} max={40} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField select fullWidth label="Format" value={config.format} onChange={e => onChange({ format: e.target.value as 'png' | 'svg' })} size="small">
                            <MenuItem value="png">PNG</MenuItem>
                            <MenuItem value="svg">SVG</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Stack spacing={1}>
                            <Typography variant="body2" color="text.secondary">
                                Tip: Higher error correction (Q/H) allows for larger logos but increases density. Keep strong contrast.
                            </Typography>
                            <Alert severity={assessment.contrastOk && assessment.logoRisk === 'low' ? 'success' : 'warning'} variant="outlined" action={
                                (assessment.recommendations.length > 0) && <Button size="small" onClick={autoFix}>Auto-fix</Button>
                            }>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                    <Chip size="small" label={`Contrast ${assessment.contrastRatio}: ${assessment.contrastOk ? 'OK' : 'Low'}`} color={assessment.contrastOk ? 'success' : 'warning'} variant={assessment.contrastOk ? 'filled' : 'outlined'} />
                                    <Chip size="small" label={`Logo risk: ${assessment.logoRisk}`} color={assessment.logoRisk === 'high' ? 'error' : assessment.logoRisk === 'moderate' ? 'warning' : 'success'} variant={assessment.logoRisk === 'low' ? 'filled' : 'outlined'} />
                                    {assessment.recommendations.length > 0 && <Typography variant="caption" component="span">{assessment.recommendations.join(' ')}</Typography>}
                                </Stack>
                            </Alert>
                        </Stack>
                    </Grid>
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
};

function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)); }

// Simple heuristic auto-fix: increase contrast using black/white if low, reduce logo size, bump error correction, ensure margin.
export function autoFixLogic(config: QrConfig): Partial<QrConfig> {
    const patch: Partial<QrConfig> = {};
    // If foreground/background contrast is low, set to black on white.
    // Basic check reusing logic by direct contrast calc through assessScanability call.
    const a = assessScanability({
        foreground: config.foreground,
        background: config.background,
        errorCorrection: config.errorCorrection,
        logoSizeRatio: config.logoSizeRatio,
        margin: config.margin
    });
    if (!a.contrastOk) {
        patch.foreground = '#000000';
        patch.background = '#ffffff';
    }
    if (a.logoRisk !== 'low') {
        patch.logoSizeRatio = Math.min(config.logoSizeRatio, 0.18);
        if (config.errorCorrection !== 'H') patch.errorCorrection = 'H';
    }
    if (config.margin < 2) patch.margin = 2;
    return patch;
}

// Wrap autoFixLogic to access latest props via closure (added after component to avoid re-definition in render path)
