import { Box, Typography } from '@mui/material';
import React from 'react';

export const Hero: React.FC = () => (
    <Box textAlign="center" mb={4}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontSize: { xs: 36, md: 48 } }}>
            Free QR Code Generator
        </Typography>
        <Typography variant="h6" color="text.secondary" maxWidth={760} mx="auto">
            100% client-side. No ads. No tracking. No redirects. Just fast, private QR codes.
        </Typography>
    </Box>
);
