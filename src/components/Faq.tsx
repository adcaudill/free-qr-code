import React from 'react';
import { Box, Typography } from '@mui/material';

const items: { q: string; a: string }[] = [
    { q: 'Is anything uploaded to a server?', a: 'No. Everything happens in your browser. Images stay local and are never sent anywhere.' },
    { q: 'Is it really free?', a: 'Yes. No ads, no tracking scripts, no upsells. MIT licensed.' },
    { q: 'Why are logos limited in size?', a: 'Large logos can obstruct the code pattern. Smaller logos keep the code scannable.' },
    { q: 'How do I make sure it scans well?', a: 'Maintain high contrast, sufficient margin (quiet zone), and reasonable logo size. Test with multiple devices.' },
    { q: 'Future features?', a: 'Potential additions: WiFi, vCard, sharing, history. Feedback welcome in the repository.' }
];

export const Faq: React.FC = () => (
    <Box component="section" mt={8}>
        <Typography variant="h4" gutterBottom>FAQ</Typography>
        {items.map(it => (
            <Box key={it.q} mb={3}>
                <Typography variant="subtitle1" fontWeight={600}>{it.q}</Typography>
                <Typography variant="body2" color="text.secondary">{it.a}</Typography>
            </Box>
        ))}
    </Box>
);
