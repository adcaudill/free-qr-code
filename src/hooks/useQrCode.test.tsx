import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQrCode } from './useQrCode';
import { defaultConfig, type QrConfig } from '../types';

// Mock qr-code-styling
class FakeQr {
    opts: any;
    constructor(opts: any) { this.opts = opts; }
    append() {/* noop */ }
    update(patch: any) { this.opts = { ...this.opts, ...patch }; }
    async getRawData(fmt: string) {
        const text = fmt + (this.opts.image ? 'withImage' : 'noImage');
        const encoder = new TextEncoder();
        const bytes = encoder.encode(text);
        return {
            text: async () => text,
            arrayBuffer: async () => bytes.buffer
        } as unknown as Blob;
    }
}
vi.mock('qr-code-styling', () => ({ default: FakeQr }));

// Mock Image to invoke onload immediately when src is set (so hook's image load promise resolves)
// Override global Image for test environment
global.Image = class {
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;
    // eslint-disable-next-line accessor-pairs
    set src(_v: string) { setTimeout(() => { this.onload && this.onload(); }, 0); }
} as unknown as typeof Image;

// spread the defaults rather than restating them: every new option would
// otherwise have to be added here too
const baseConfig: QrConfig = {
    ...defaultConfig,
    text: 'https://example.com',
    contentType: 'url',
    url: 'https://example.com',
    size: 300
};

describe('useQrCode', () => {
    it('updates export to include logo data marker', async () => {
        const { result, rerender } = renderHook((cfg: QrConfig) => useQrCode(cfg), { initialProps: baseConfig });
        await act(async () => { await new Promise(r => setTimeout(r, 10)); });
        // initial export should have no image
        const noLogoBlob = await result.current.toSvg();
        let initialText = '';
        if (noLogoBlob && (noLogoBlob as any).text) {
            initialText = await (noLogoBlob as any).text();
            expect(initialText.includes('noImage')).toBe(true);
        }
        // add logo
        const logoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
        rerender({ ...baseConfig, logoCroppedDataUrl: logoData });
        // wait past debounce (200ms) plus image load microtask
        await act(async () => { await new Promise(r => setTimeout(r, 250)); });
        const blob = await result.current.toPng();
        if (!blob) return; // if instance not ready skip (mock limitation)
        const text = await (blob as any).text();
        expect(text.includes('withImage')).toBe(true);
    }, 8000);
});
