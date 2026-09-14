import React, { useCallback } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Slider, TextField, Typography, MenuItem, Alert, Stack, Chip, Button, FormControlLabel, Switch } from '@mui/material';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { QUIET_ZONE_MAX, type QrConfig } from '../types';
import { assessScanability } from '../utils/scanQuality';
import { LogoUploader } from './LogoUploader';

interface Props {
    config: QrConfig;
    onChange: (patch: Partial<QrConfig>) => void;
    onReset?: () => void;
}

// L/M/Q/H are the spec's names for how much of the code can be lost and still
// scan. The percentages are what those letters actually mean.
const ERROR_CORRECTION_LEVELS: { value: QrConfig['errorCorrection']; label: string }[] = [
    { value: 'L', label: 'Low (7%)' },
    { value: 'M', label: 'Medium (15%)' },
    { value: 'Q', label: 'High (25%)' },
    { value: 'H', label: 'Highest (30%)' }
];

interface NumberFieldProps {
    label: string;
    value: number;
    min: number;
    max?: number;
    helperText?: string;
    onCommit: (value: number) => void;
}

// Clamping on every keystroke fights whoever is typing: deleting a digit from
// "1024" snaps straight back to the minimum. The value is applied on blur or
// Enter instead, so the field can hold a half-finished number in the meantime.
const NumberField: React.FC<NumberFieldProps> = ({ label, value, min, max, helperText, onCommit }) => {
    const [draft, setDraft] = React.useState(String(value));

    // follow the value when something else changes it (auto-fix, reset, restore)
    React.useEffect(() => { setDraft(String(value)); }, [value]);

    const commit = () => {
        const parsed = Number(draft);
        if (draft.trim() === '' || Number.isNaN(parsed)) {
            setDraft(String(value));
            return;
        }
        const next = clamp(Math.round(parsed), min, max ?? Number.MAX_SAFE_INTEGER);
        setDraft(String(next));
        if (next !== value) onCommit(next);
    };

    return (
        <TextField
            type="number"
            label={label}
            value={draft}
            size="small"
            fullWidth
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
            InputProps={{ inputProps: { min, max } }}
            helperText={helperText}
        />
    );
};

export const AdvancedOptions: React.FC<Props> = ({ config, onChange, onReset }) => {
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
                        <TextField select fullWidth label="Error Correction" value={config.errorCorrection} onChange={e => onChange({ errorCorrection: e.target.value as QrConfig['errorCorrection'] })} size="small" helperText="How much of the code can be damaged and still scan">
                            {ERROR_CORRECTION_LEVELS.map(l => <MenuItem value={l.value} key={l.value}>{l.label}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <NumberField
                            label="Size (px)"
                            value={config.size}
                            min={MIN_SIZE}
                            onCommit={v => onChange({ size: v })}
                            helperText={config.size > PNG_SAFE_SIZE ? 'Browsers cap canvas size; export as SVG' : undefined}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <NumberField
                            label="Quiet zone"
                            value={config.margin}
                            min={0}
                            max={QUIET_ZONE_MAX}
                            onCommit={v => onChange({ margin: v })}
                            helperText="Blank border, in squares (4 is standard)"
                        />
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
                        <Slider size="small" value={Math.round(config.logoSizeRatio * 100)} onChange={(_, v) => onChange({ logoSizeRatio: (v as number) / 100 })} min={5} max={100} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControlLabel
                            control={<Switch checked={config.logoColorOverlay} onChange={e => onChange({ logoColorOverlay: e.target.checked })} />}
                            label="Color Overlay"
                        />
                    </Grid>
                    {config.logoColorOverlay && (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <TextField type="color" label="Logo Color" aria-label="Logo color" value={config.logoColor} onChange={e => onChange({ logoColor: e.target.value })} size="small" fullWidth InputLabelProps={{ shrink: true }} inputProps={{ style: { padding: 2 } }} helperText="Recolors the logo, keeping its shape" sx={{ '& input[type=color]:focus-visible': { outline: '2px solid', outlineOffset: 2 } }} />
                        </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <TextField select fullWidth label="Format" value={config.format} onChange={e => onChange({ format: e.target.value as 'png' | 'svg' })} size="small">
                            <MenuItem value="png">PNG</MenuItem>
                            <MenuItem value="svg">SVG</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Stack spacing={1}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap">
                                <Typography variant="body2" color="text.secondary">
                                    Tip: Higher error correction (High/Highest) allows for larger logos but increases density. Keep strong contrast.
                                </Typography>
                                {onReset && <Button size="small" onClick={onReset}>Reset settings</Button>}
                            </Stack>
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

// Below this the QR modules stop fitting the canvas and the library throws.
// There is no upper bound: the output is vector, so any size renders - but a
// PNG has to go through a canvas, and browsers stop honouring those well before
// the SVG would give up.
const MIN_SIZE = 128;
const PNG_SAFE_SIZE = 4096;

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
