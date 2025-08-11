import { describe, it, expect } from 'vitest';
import { contrastRatio, assessScanability } from './scanQuality';

describe('scanQuality', () => {
  it('computes higher contrast for black/white than gray/gray', () => {
    const high = contrastRatio('#000000', '#ffffff');
    const low = contrastRatio('#777777', '#999999');
    expect(high).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(10); // near max (approx 21 but we only assert >10 to be lenient)
  });

  it('flags low contrast correctly', () => {
    const a = assessScanability({ foreground: '#777777', background: '#808080', errorCorrection: 'M', logoSizeRatio: 0.15, margin: 4 });
    expect(a.contrastOk).toBe(false);
    expect(a.recommendations.some(r => r.toLowerCase().includes('contrast'))).toBe(true);
  });

  it('assigns higher logo risk for large logo with low error correction', () => {
    const lowRisk = assessScanability({ foreground: '#000000', background: '#ffffff', errorCorrection: 'H', logoSizeRatio: 0.15, margin: 4 });
    const highRisk = assessScanability({ foreground: '#000000', background: '#ffffff', errorCorrection: 'L', logoSizeRatio: 0.3, margin: 4 });
    expect(lowRisk.logoRisk).toBe('low');
    expect(highRisk.logoRisk).toBe('high');
  });

  it('recommends margin increase when margin < 2', () => {
    const a = assessScanability({ foreground: '#000000', background: '#ffffff', errorCorrection: 'H', logoSizeRatio: 0.1, margin: 0 });
    expect(a.recommendations.some(r => r.toLowerCase().includes('margin'))).toBe(true);
  });
});
