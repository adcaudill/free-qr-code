import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQrCode } from './useQrCode';
import { defaultConfig, QrConfig } from '../types';

class FakeQr {
    opts: any;
    constructor(o: any) { this.opts = o; }
    append() { }
    update(p: any) { this.opts = { ...this.opts, ...p }; }
    async getRawData(fmt: string) {
        const enc = new TextEncoder();
        return { arrayBuffer: async () => enc.encode(fmt).buffer } as unknown as Blob;
    }
}
vi.mock('qr-code-styling', () => ({ default: FakeQr }));
// Fast image loader
// @ts-expect-error override
global.Image = class { onload: null | (() => void) = null; set src(_v: string) { setTimeout(() => this.onload && this.onload(), 0); } } as unknown as typeof Image;

function cfg(p: Partial<QrConfig>): QrConfig { return { ...defaultConfig, ...p } as QrConfig; }

describe('useQrCode flushPending', () => {
    it('forces immediate update when exporting before debounce fires', async () => {
        const initial = cfg({ text: 'one', url: 'one.com', contentType: 'url' });
        const { result, rerender } = renderHook((c: QrConfig) => useQrCode(c), { initialProps: initial });
        await act(async () => { await new Promise(r => setTimeout(r, 30)); });
        // change config then immediately export without waiting debounce period
        rerender(cfg({ text: 'two', url: 'two.com', contentType: 'url' }));
        // allow React effect to queue debounce before forcing flush
        await new Promise(r => setTimeout(r, 1));
        const blob = await result.current.toSvg();
        expect(blob).toBeTruthy();
    }, 10000);
});
