import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQrCode } from './useQrCode';
import { defaultConfig, QrConfig } from '../types';

// jsdom has no canvas, so the tint itself is covered in utils/logoTint.test.ts;
// here it is stubbed to prove the wiring reaches the exported file.
vi.mock('../utils/logoTint', () => ({
    tintLogo: vi.fn(async (src: string, color: string) => `${src}-tinted-${color.replace('#', '')}`)
}));

// These run against the real qr-code-styling so they assert what actually ends
// up in the exported file. Only the browser image plumbing is stubbed; PNG is
// out of reach here because jsdom has no canvas.toBlob.

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

class FakeImage {
    width = 64;
    height = 64;
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;
    private _src = '';
    set src(v: string) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); }
    get src() { return this._src; }
}
global.Image = FakeImage as unknown as typeof Image;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).Image = FakeImage;

function cfg(overrides: Partial<QrConfig>): QrConfig {
    return { ...defaultConfig, contentType: 'url', url: 'example.com', text: 'https://example.com', ...overrides };
}

async function exportedSvg(toSvg: () => Promise<Blob | null>): Promise<string> {
    const blob = await toSvg();
    expect(blob).toBeTruthy();
    return await (blob as Blob).text();
}

async function settle(ms = 300) {
    await act(async () => { await new Promise(r => setTimeout(r, ms)); });
}

describe('useQrCode SVG export', () => {
    it('includes the logo after it is added', async () => {
        const { result, rerender } = renderHook((c: QrConfig) => useQrCode(c), { initialProps: cfg({}) });
        await settle(50);
        expect(await exportedSvg(result.current.toSvg)).not.toMatch(/<image/);

        rerender(cfg({ logoCroppedDataUrl: PNG }));
        await settle();
        expect(await exportedSvg(result.current.toSvg)).toMatch(/<image/);
    }, 15000);

    it('exports the current config even while a debounced update is pending', async () => {
        const { result, rerender } = renderHook((c: QrConfig) => useQrCode(c), { initialProps: cfg({}) });
        await settle(50);
        // change and export immediately, well inside the 200ms debounce window
        rerender(cfg({ background: '#ABCDEF', logoCroppedDataUrl: PNG }));
        const svg = await exportedSvg(result.current.toSvg);
        expect(svg).toMatch(/ABCDEF/i);
        expect(svg).toMatch(/<image/);
    }, 15000);

    it('embeds the recoloured logo when the colour overlay is on', async () => {
        const { result } = renderHook((c: QrConfig) => useQrCode(c), {
            initialProps: cfg({ logoCroppedDataUrl: PNG, logoColorOverlay: true, logoColor: '#1976d2' })
        });
        await settle(50);
        expect(await exportedSvg(result.current.toSvg)).toContain('-tinted-1976d2');
    }, 15000);

    it('leaves the logo alone when the colour overlay is off', async () => {
        const { result } = renderHook((c: QrConfig) => useQrCode(c), {
            initialProps: cfg({ logoCroppedDataUrl: PNG, logoColorOverlay: false, logoColor: '#1976d2' })
        });
        await settle(50);
        const svg = await exportedSvg(result.current.toSvg);
        expect(svg).toMatch(/<image/);
        expect(svg).not.toContain('-tinted-');
    }, 15000);

    it('drops the gradient when it is switched back off', async () => {
        const gradient = cfg({ useGradient: true, foreground: '#111111', gradientColor: '#FF0000' });
        const { result, rerender } = renderHook((c: QrConfig) => useQrCode(c), { initialProps: gradient });
        await settle(50);
        expect(await exportedSvg(result.current.toSvg)).toMatch(/linearGradient/);

        rerender(cfg({ ...gradient, useGradient: false }));
        await settle();
        expect(await exportedSvg(result.current.toSvg)).not.toMatch(/linearGradient/);
    }, 15000);
});
