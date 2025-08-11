import React from 'react';
import { Box, Button, Stack, TextField, Tooltip, Tabs, Tab, FormControlLabel, Checkbox, MenuItem, Typography } from '@mui/material';
import { urlSchema } from '../utils/validation';
import type { QrConfig } from '../types';

interface Props {
    config: QrConfig;
    onPatch: (p: Partial<QrConfig>) => void;
    onDownload: () => void;
    disabled?: boolean;
}

function a11yProps(index: number) { return { id: `content-tab-${index}`, 'aria-controls': `content-tabpanel-${index}` }; }

export const SimpleForm: React.FC<Props> = ({ config, onPatch, onDownload, disabled }) => {
    const [urlError, setUrlError] = React.useState<string | null>(null);

    const handleUrlChange = (value: string) => {
        onPatch({ url: value });
        const parsed = urlSchema.safeParse(value);
        setUrlError(parsed.success ? null : parsed.error.issues[0].message);
    };

    const currentType = config.contentType;

    return (
        <Box component="form" onSubmit={e => { e.preventDefault(); onDownload(); }}>
            <Tabs value={currentType} onChange={(_, v) => onPatch({ contentType: v })} variant="scrollable" scrollButtons allowScrollButtonsMobile sx={{ mb: 2 }}>
                <Tab label="URL" value="url" {...a11yProps(0)} />
                <Tab label="WiFi" value="wifi" {...a11yProps(1)} />
                <Tab label="vCard" value="vcard" {...a11yProps(2)} />
                <Tab label="SMS" value="sms" {...a11yProps(3)} />
            </Tabs>
            {currentType === 'url' && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
                    <TextField label="URL" fullWidth value={config.url} onChange={e => handleUrlChange(e.target.value)} error={!!urlError} helperText={urlError || ' '} size="small" autoFocus placeholder="https://example.com" />
                    <Tooltip title={urlError ? 'Fix URL first' : 'Download'}>
                        <span><Button variant="contained" type="submit" disabled={!!urlError || disabled || !config.url}>Download</Button></span>
                    </Tooltip>
                </Stack>
            )}
            {currentType === 'wifi' && (
                <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField label="SSID" value={config.wifi?.ssid} onChange={e => onPatch({ wifi: { ...config.wifi!, ssid: e.target.value } })} fullWidth size="small" />
                        <TextField label="Password" value={config.wifi?.password} onChange={e => onPatch({ wifi: { ...config.wifi!, password: e.target.value } })} type="password" fullWidth size="small" disabled={config.wifi?.security === 'nopass'} />
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField label="Security" select value={config.wifi?.security} onChange={e => onPatch({ wifi: { ...config.wifi!, security: e.target.value as any } })} size="small" sx={{ minWidth: 140 }}>
                            <MenuItem value="WPA">WPA/WPA2</MenuItem>
                            <MenuItem value="WEP">WEP</MenuItem>
                            <MenuItem value="nopass">None</MenuItem>
                        </TextField>
                        <FormControlLabel control={<Checkbox checked={config.wifi?.hidden} onChange={e => onPatch({ wifi: { ...config.wifi!, hidden: e.target.checked } })} />} label="Hidden" />
                        <Box flexGrow={1} />
                        <Tooltip title="Download">
                            <span><Button variant="contained" type="submit" disabled={disabled || !config.wifi?.ssid}>Download</Button></span>
                        </Tooltip>
                    </Stack>
                </Stack>
            )}
            {currentType === 'vcard' && (
                <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField label="First Name" value={config.vcard?.firstName} onChange={e => onPatch({ vcard: { ...config.vcard!, firstName: e.target.value } })} size="small" fullWidth />
                        <TextField label="Last Name" value={config.vcard?.lastName} onChange={e => onPatch({ vcard: { ...config.vcard!, lastName: e.target.value } })} size="small" fullWidth />
                    </Stack>
                    <TextField label="Organization" value={config.vcard?.org} onChange={e => onPatch({ vcard: { ...config.vcard!, org: e.target.value } })} size="small" fullWidth />
                    <TextField label="Title" value={config.vcard?.title} onChange={e => onPatch({ vcard: { ...config.vcard!, title: e.target.value } })} size="small" fullWidth />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField label="Phone" value={config.vcard?.phone} onChange={e => onPatch({ vcard: { ...config.vcard!, phone: e.target.value } })} size="small" fullWidth />
                        <TextField label="Email" value={config.vcard?.email} onChange={e => onPatch({ vcard: { ...config.vcard!, email: e.target.value } })} size="small" fullWidth />
                    </Stack>
                    <TextField label="URL" value={config.vcard?.url} onChange={e => onPatch({ vcard: { ...config.vcard!, url: e.target.value } })} size="small" fullWidth />
                    <Stack direction="row" spacing={2}>
                        <Tooltip title="Download">
                            <span><Button variant="contained" type="submit" disabled={disabled || !(config.vcard?.firstName || config.vcard?.lastName)}>Download</Button></span>
                        </Tooltip>
                    </Stack>
                </Stack>
            )}
            {currentType === 'sms' && (
                <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField label="Phone" value={config.sms?.phone} onChange={e => onPatch({ sms: { ...config.sms!, phone: e.target.value } })} size="small" fullWidth />
                        <TextField label="Message" value={config.sms?.message} onChange={e => onPatch({ sms: { ...config.sms!, message: e.target.value } })} size="small" fullWidth />
                    </Stack>
                    <Tooltip title="Download">
                        <span><Button variant="contained" type="submit" disabled={disabled || !config.sms?.phone}>Download</Button></span>
                    </Tooltip>
                    <Typography variant="caption" color="text.secondary">Phone number format should include country code for best compatibility.</Typography>
                </Stack>
            )}
        </Box>
    );
};
