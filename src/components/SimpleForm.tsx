import React from 'react';
import { Box, Button, Stack, TextField, Tooltip } from '@mui/material';
import { urlSchema } from '../utils/validation';

interface Props {
    url: string;
    onChange: (v: string) => void;
    onDownload: () => void;
    disabled?: boolean;
}

export const SimpleForm: React.FC<Props> = ({ url, onChange, onDownload, disabled }) => {
    const [error, setError] = React.useState<string | null>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        onChange(value);
        const parsed = urlSchema.safeParse(value);
        setError(parsed.success ? null : parsed.error.issues[0].message);
    }

    return (
        <Box component="form" onSubmit={e => { e.preventDefault(); onDownload(); }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
                <TextField label="URL" fullWidth value={url} onChange={handleChange} error={!!error} helperText={error || ' '} size="small" autoFocus placeholder="https://example.com" />
                <Tooltip title={error ? 'Fix URL first' : 'Download as PNG'}>
                    <span>
                        <Button variant="contained" size="medium" type="submit" disabled={!!error || disabled}>Download</Button>
                    </span>
                </Tooltip>
            </Stack>
        </Box>
    );
};
