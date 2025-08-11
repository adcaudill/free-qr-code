# free-qr-code

![CI](https://github.com/adcaudill/free-qr-code/actions/workflows/ci.yml/badge.svg)

Free, open-source, client-side QR code generator. No ads. No tracking pixels. No redirects. Everything happens in your browser.

Search phrases this project intentionally supports: free QR code generator, WiFi QR code, vCard QR code, SMS QR code, custom QR code with logo, gradient QR code, QR code without tracking.
<!-- SEO variants: wifi, vcard, sms, qr code generator free -->

## Features

- Multiple content types: URL, WiFi network (WPA/WEP/open + hidden), vCard contact, SMS (number + optional message)
- Advanced styling: dot/module shapes, corner styles, solid or linear/radial gradient foregrounds
- Real-time scan quality assessment (contrast, logo risk, quiet zone) with one-click Auto-Fix
- Logo upload + crop (processed locally, never uploaded) with keyboard accessible cropper
- Debounced & reliable exports (flush logic ensures latest QR when you download)
- PNG & SVG export (crisp vector for print; raster for quick sharing)
- Dark / light mode (auto system detection) + accessible color controls
- Fully client-side (no server, no analytics); ideal for privacy-centric environments
- Responsive & keyboard accessible UI
- MIT licensed and easy to fork / self-host (Cloudflare Pages ready)

## Quick Start

1. Pick a content type (URL, WiFi, vCard, SMS) and fill in the fields.
2. (Optional) Upload a logo, crop it, and adjust size.
3. Tune styling (colors, shapes, gradient, error correction, margin).
4. Watch the scan quality panel; use Auto-Fix if recommendations appear.
5. Export as PNG (general sharing) or SVG (print / design tools).

## Why No Server?

Security & privacy. Your WiFi password, contact details, phone numbers, and logos never leave the browser context. Open DevTools Network tab—you'll see no data posts.

## Scan Quality & Auto-Fix

The app evaluates:

- Contrast ratio between foreground/background
- Logo risk (size vs error correction level)
- Quiet zone (margin) sufficiency

If issues are detected, Auto-Fix can:

- Force high contrast (black on white)
- Shrink an oversized logo
- Raise error correction (up to H)
- Ensure a minimal margin

## Styling Tips

- Higher error correction (Q/H) tolerates bigger logos but increases density.
- Maintain strong contrast (dark foreground on light background) for best reliability.
- Excessive gradients or very light colors can reduce scan speed—test with multiple devices.
- Fancy dot shapes are cosmetic; readability still depends on contrast and quiet zone.

## Exports: PNG vs SVG

| Use Case | Recommended |
|----------|-------------|
| Print, design tools, size scaling | SVG |
| Quick share, chat apps, previews | PNG |

SVG exports are text (XML) and infinitely scalable. PNG exports are raster; choose a larger size if you expect downscaling.

## Tech Stack

- React + TypeScript + Vite
- Material UI (MUI) for theming
- `qr-code-styling` for QR generation & advanced styling/gradients
- `zod` for lightweight validation
- Vitest + React Testing Library for a growing test suite (29 tests covering builders, styling, debounce flush, auto‑fix)

## Local Development

```
npm install
npm run dev
```

Visit http://localhost:5173

## Production Build / Deploy (Cloudflare Pages)

```
npm run build
```

Outputs to `dist/`.

Cloudflare Pages settings:

- Build command: `npm run build`
- Output directory: `dist`
- (Optional) Set security headers via _headers file / Pages config.

## Accessibility

- Keyboard navigable logo cropper (arrow keys move/resize)
- Sufficient color contrast guidance
- ARIA labels and semantic structure for assistive tech

## Privacy & Security

- No outbound API calls for QR generation
- No analytics, tracking, or cookies
- All image processing & QR rendering performed in-browser
- Open source—inspect or fork freely

## Roadmap / Potential Enhancements

Shipped from earlier roadmap: WiFi, vCard, SMS content types, gradient styling, auto-fix, accessibility improvements.

Potential next steps:

- Shareable config via URL hash
- Local recent history / favorites
- PWA (offline support + installable)
- Drag-and-drop SVG logo recoloring
- Bulk generation (CSV import) – maybe separate tool
- Configurable gradient stops beyond two colors

## Contributing

Issues and PRs welcome. Please add or update tests for user‑visible changes.

## License

MIT License – see `LICENSE`.

---

If this project helps you, consider giving it a ⭐ so others can find a privacy-first QR code generator.
