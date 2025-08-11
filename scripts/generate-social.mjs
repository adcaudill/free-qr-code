#!/usr/bin/env node
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const WIDTH = 1200; // 1.91:1 recommended (1200x630) choose 630 height
const HEIGHT = 630;
const OUT = path.resolve('public/social.png');

// Colors
const bgTop = '#0d47a1';
const bgBottom = '#1976d2';
const panelBg = '#ffffff';
const panelShadow = 'rgba(0,0,0,0.25)';

// Create gradient background using two solid halves then blur blend
async function createBackground() {
    const top = await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: bgTop } }).png().toBuffer();
    const bottom = await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: bgBottom } }).png().toBuffer();
    // Stack vertical
    const stacked = await sharp({ create: { width: WIDTH, height: HEIGHT * 2, channels: 4, background: bgBottom } })
        .composite([
            { input: top, top: 0, left: 0 },
            { input: bottom, top: HEIGHT, left: 0 }
        ])
        .resize(WIDTH, HEIGHT, { fit: 'cover' })
        .blur(60)
        .png()
        .toBuffer();
    return stacked;
}

function svgText() {
    return Buffer.from(`<?xml version="1.0"?>
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .title { font: 700 72px 'Inter', 'Helvetica Neue', Arial, sans-serif; fill: #ffffff; }
      .subtitle { font: 400 34px 'Inter', 'Helvetica Neue', Arial, sans-serif; fill: #e3f2fd; }
      .panelTitle { font: 600 36px 'Inter', 'Helvetica Neue', Arial, sans-serif; fill: #0d47a1; }
      .panelText { font: 400 24px 'Inter', 'Helvetica Neue', Arial, sans-serif; fill: #0d47a1; }
    </style>
    <rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${bgTop}" />
        <stop offset="100%" stop-color="${bgBottom}" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.25" />
      </filter>
    </defs>

    <text x="60" y="170" class="title">Free QR Code</text>
    <text x="60" y="240" class="subtitle">No ads. No tracking. 100% client-side.</text>

    <g filter="url(#shadow)">
      <rect x="60" y="300" rx="24" ry="24" width="1080" height="250" fill="${panelBg}" />
      <text x="100" y="380" class="panelTitle">Generate instantly</text>
      <text x="100" y="430" class="panelText">• Custom colors  • Logo overlay  • PNG/SVG export</text>
      <text x="100" y="470" class="panelText">• Scan quality tips  • Dark mode  • Open source</text>
    </g>
  </svg>`);
}

async function build() {
    const bg = await createBackground();
    const text = svgText();
    const composite = await sharp(bg)
        .composite([{ input: text, top: 0, left: 0 }])
        .png({ quality: 95 })
        .toBuffer();
    await fs.promises.mkdir(path.dirname(OUT), { recursive: true });
    await fs.promises.writeFile(OUT, composite);
    console.log('Generated social image:', OUT);
}

build().catch(e => { console.error(e); process.exit(1); });
