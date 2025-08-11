import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQrCode } from './useQrCode';
import { defaultConfig, QrConfig } from '../types';
import { autoFixLogic } from '../components/AdvancedOptions';

// Fake QR implementation capturing constructor + update patches
class FakeQr {
    static last: any;
    opts: any;
    constructor(opts: any) { this.opts = opts; FakeQr.last = { ctor: structuredClone(opts), updates: [] }; }
    append() { /* no-op */ }
    update(patch: any) { this.opts = { ...this.opts, ...patch }; FakeQr.last.updates.push(structuredClone(patch)); }
    async getRawData(fmt: string) {
        const enc = new TextEncoder();
        const bytes = enc.encode(fmt);
        return { arrayBuffer: async () => bytes.buffer } as unknown as Blob;
    }
}
vi.mock('qr-code-styling', () => ({ default: FakeQr }));

// Fast-loading Image mock so logo path resolves immediately
global.Image = class { onload: null | (() => void) = null; set src(_v: string) { setTimeout(() => this.onload && this.onload(), 0); } } as unknown as typeof Image;

function cfg(overrides: Partial<QrConfig>): QrConfig { return { ...defaultConfig, ...overrides } as QrConfig; }

async function wait(ms: number) { await new Promise(r => setTimeout(r, ms)); }

describe('useQrCode integration scenarios', () => {
    it('updates underlying instance when error correction level changes', async () => {
        const initial = cfg({ text: 'abc', url: 'https://one', contentType: 'url', errorCorrection: 'L' });
        const { rerender } = renderHook((c: QrConfig) => useQrCode(c), { initialProps: initial });
        await act(async () => { await wait(30); }); // allow constructor
        rerender(cfg({ ...initial, errorCorrection: 'H' }));
        await act(async () => { await wait(250); }); // wait for debounce + update
        const lastWithQr = [...FakeQr.last.updates].reverse().find(u => u.qrOptions);
        expect(lastWithQr).toBeTruthy();
        expect(lastWithQr.qrOptions.errorCorrectionLevel).toBe('H');
    });

    it('applies auto-fix patch end-to-end (contrast, logo size, margin, error correction)', async () => {
        const problem = cfg({
            foreground: '#777777',
            background: '#888888',
            logoSizeRatio: 0.32,
            errorCorrection: 'M',
            margin: 0,
            text: 'data',
            url: 'https://example.com',
            contentType: 'url'
        });
        const { rerender } = renderHook((c: QrConfig) => useQrCode(c), { initialProps: problem });
        await act(async () => { await wait(30); }); // constructor
        const patch = autoFixLogic(problem);
        // Ensure patch contains expected fields before applying
        expect(patch.errorCorrection).toBe('H');
        expect(patch.margin).toBe(2);
        expect(patch.logoSizeRatio).toBeLessThanOrEqual(0.18);
        expect(patch.foreground).toBe('#000000');
        expect(patch.background).toBe('#ffffff');
        const fixed = { ...problem, ...patch };
        rerender(fixed);
        await act(async () => { await wait(250); });
        const last = FakeQr.last.updates.at(-1);
        expect(last).toBeTruthy();
        expect(last.qrOptions.errorCorrectionLevel).toBe('H');
        expect(last.margin).toBe(2); // margin included in update patch
        // dotsOptions / backgroundOptions always resent; check effective colors
        expect(last.backgroundOptions.color).toBe('#ffffff');
        // gradient unused => dotsOptions has color directly
        expect(last.dotsOptions.color).toBe('#000000');
    });

    it('exports distinct blobs for png vs svg and handles rapid config/format switches', async () => {
        const start = cfg({ text: 'first', url: 'https://one', contentType: 'url' });
        const { result, rerender } = renderHook((c: QrConfig) => useQrCode(c), { initialProps: start });
        await act(async () => { await wait(40); });
        // Trigger change then immediately export PNG (flush must apply pending update)
        rerender(cfg({ ...start, text: 'second', url: 'https://two', contentType: 'url', format: 'png' }));
        await act(async () => { await wait(1); }); // give effect chance to schedule debounce
        const pngBlob = await result.current.toPng();
        expect(pngBlob).toBeTruthy();
        const pngBuf = await (await (pngBlob as any).arrayBuffer());
        rerender(cfg({ ...start, text: 'third', url: 'https://three', contentType: 'url', format: 'svg' }));
        await act(async () => { await wait(1); });
        const svgBlob = await result.current.toSvg();
        const svgBuf = await (await (svgBlob as any).arrayBuffer());
        const dec = new TextDecoder();
        expect(dec.decode(pngBuf)).toBe('png');
        expect(dec.decode(svgBuf)).toBe('svg');
    }, 10000);
});
