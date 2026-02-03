import { Box, Paper, Typography } from '@mui/material';
import React from 'react';

interface Props {
    qrRef: React.RefObject<HTMLDivElement | null>;
    ready: boolean;
}

export const QrPreview: React.FC<Props> = ({ qrRef, ready }) => (
    <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 300 }}>
        <Box ref={qrRef} sx={{ '& canvas, & svg': { width: '100% !important', height: 'auto !important' }, maxWidth: 320 }} />
        {!ready && <Typography variant="body2" color="text.secondary" mt={2}>Preparing generator…</Typography>}
    </Paper>
);
