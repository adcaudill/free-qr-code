import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQrCode } from './useQrCode';
import { defaultConfig, QrConfig } from '../types';

// Capture constructor + update snapshots
class FakeQr {
  static last: any;
  opts: any;
  constructor(opts: any){ this.opts = opts; FakeQr.last = { ctor: structuredClone(opts), updates: [] }; }
  append(){}
  update(patch: any){ this.opts = { ...this.opts, ...patch }; FakeQr.last.updates.push(structuredClone(patch)); }
  async getRawData(fmt: string){
    const encoder = new TextEncoder();
    const bytes = encoder.encode(fmt);
    return { arrayBuffer: async () => bytes.buffer } as unknown as Blob;
  }
}
vi.mock('qr-code-styling', () => ({ default: FakeQr }));

// Fast-loading Image mock
// @ts-expect-error override
global.Image = class { onload: null | (()=>void) = null; set src(_v:string){ setTimeout(()=> this.onload && this.onload(),0); } } as unknown as typeof Image;

function base(overrides: Partial<QrConfig>): QrConfig {
  return { ...defaultConfig, ...overrides } as QrConfig;
}

describe('useQrCode styling snapshots', () => {
  it('applies gradient then switches to solid style', async () => {
    const cfg = base({
      foreground: '#111111',
      gradientColor: '#FF0000',
      useGradient: true,
      gradientType: 'linear',
      gradientRotation: 90,
      dotStyle: 'classy',
      cornerSquareStyle: 'extra-rounded',
      cornerDotStyle: 'square',
      text: 'data',
      contentType: 'url',
      url: 'https://example.com'
    });

    const { rerender } = renderHook((c: QrConfig) => useQrCode(c), { initialProps: cfg });
    // allow initial constructor + append
    await act(async () => { await new Promise(r => setTimeout(r, 30)); });

    // Constructor snapshot assertions
    const ctorDots = FakeQr.last.ctor.dotsOptions;
    expect(ctorDots.gradient).toBeTruthy();
    expect(ctorDots.gradient.type).toBe('linear');
    expect(ctorDots.gradient.colorStops[0].color).toBe('#111111');
    expect(ctorDots.gradient.colorStops[1].color).toBe('#FF0000');

    // Toggle gradient off & change styles
    rerender(base({ ...cfg, useGradient: false, dotStyle: 'dots', cornerDotStyle: 'dot' }));
    await act(async () => { await new Promise(r => setTimeout(r, 250)); }); // wait for debounce

  const lastUpdateWithDots = [...FakeQr.last.updates].reverse().find((u: any) => u.dotsOptions);
  expect(lastUpdateWithDots).toBeTruthy();
  expect(lastUpdateWithDots.dotsOptions.gradient).toBeUndefined();
  expect(lastUpdateWithDots.dotsOptions.type).toBe('dots');
  });
});
