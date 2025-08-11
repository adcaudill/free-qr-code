# free-qr-code

![CI](https://github.com/adcaudill/free-qr-code/actions/workflows/ci.yml/badge.svg)

Free, client-side QR code generator. No ads. No tracking. No redirects.

## Features

- Instant QR generation for URLs
- Advanced options (size, error correction, margin, colors, logo overlay, PNG/SVG export)
- Scan quality assessment with one-click auto-fix suggestions
- Logo upload processed locally (never leaves your browser)
- Dark / light mode with system preference detection
- Accessible, responsive single-page app
- 100% static – ideal for Cloudflare Pages deployment

## Tech Stack

- React + TypeScript + Vite
- Material UI (MUI) for styling & theming
- `qr-code-styling` for QR generation with logo support
- `zod` for lightweight validation

## Local Development

```
npm install
npm run dev
```

Visit http://localhost:5173

## Production Build

```
npm run build
```

Outputs to `dist/` (default for Vite). Configure Cloudflare Pages with:

- Build command: `npm run build`
- Output directory: `dist`

## Privacy & Security

All QR code generation and logo processing happen entirely in-browser. No data is sent to a server.

## Roadmap (Potential Enhancements)

- Additional data types (WiFi, vCard, text)
- Shareable config via URL hash
- Local history of generated codes
- PWA/offline support

## License

MIT License – see `LICENSE` file.
