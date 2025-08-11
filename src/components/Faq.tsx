import React from 'react';
import { Box, Typography } from '@mui/material';

const items: { q: string; a: string }[] = [
    {
        q: 'Is anything uploaded to a server?',
        a: 'No. Generation, styling, and logo cropping all run locally in your browser. No data leaves the page.'
    },
    {
        q: 'Which QR content types are supported?',
        a: 'URL, WiFi (WPA/WEP/open + hidden flag), vCard contact, and SMS (number with optional pre-filled message).'
    },
    {
        q: 'How do I create a WiFi QR code?',
        a: 'Choose WiFi, enter the network SSID, select security (WPA/WEP or open), add the password if required, optionally mark it hidden, then download.'
    },
    {
        q: 'What is a vCard QR code?',
        a: 'A QR that encodes contact details (name, org, title, phone, email, URL) so phones can add a contact instantly.'
    },
    {
        q: 'Why is error correction important?',
        a: 'Higher levels (Q/H) let the code survive larger logos or damage, but increase pattern density. Balance logo size and readability.'
    },
    {
        q: 'Why are logos limited in size?',
        a: 'Oversized logos cover data modules. The app warns about risk and Auto-Fix can shrink logos and raise error correction.'
    },
    {
        q: 'What does Auto-Fix do?',
        a: 'It can enforce high contrast (black/white), shrink an oversized logo, raise error correction to H, and ensure a basic quiet zone.'
    },
    {
        q: 'How do gradients affect scan reliability?',
        a: 'Moderate, high-contrast gradients are fine. Avoid very light or low-contrast blends. Always test on multiple devices.'
    },
    {
        q: 'PNG vs SVG export?',
        a: 'Use SVG for printing or resizing (vector, crisp at any size). Use PNG for quick sharing in chat or social apps.'
    },
    {
        q: 'Is it really free and without tracking?',
        a: 'Yes. No ads, analytics, or tracking scripts. MIT licensed—fork or self-host easily.'
    },
    {
        q: 'How do I maximize scan success?',
        a: 'Dark foreground on light background, adequate margin (quiet zone), reasonable logo size, and test under varied lighting.'
    },
    {
        q: 'Can I host this myself?',
        a: 'Yes. It is a static React build. Deploy to Cloudflare Pages, Netlify, GitHub Pages, or any static host.'
    },
    {
        q: 'Will you add more features?',
        a: 'Possible future ideas: shareable config links, offline/PWA mode, local history, multi-stop gradients, batch generation.'
    }
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
