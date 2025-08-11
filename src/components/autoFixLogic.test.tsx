import { describe, it, expect } from 'vitest';
import { autoFixLogic } from './AdvancedOptions';
import { defaultConfig } from '../types';

function makeCfg(overrides: Partial<typeof defaultConfig> = {}) {
    return { ...defaultConfig, ...overrides };
}

describe('autoFixLogic', () => {
    it('fixes low contrast by forcing black/white', () => {
        const cfg = makeCfg({ foreground: '#777777', background: '#888888' });
        const patch = autoFixLogic(cfg);
        expect(patch.foreground).toBe('#000000');
        expect(patch.background).toBe('#ffffff');
    });

    it('reduces logo size and raises error correction when risk high', () => {
        const cfg = makeCfg({ logoSizeRatio: 0.32, errorCorrection: 'M' });
        const patch = autoFixLogic(cfg);
        expect(patch.logoSizeRatio).toBeLessThanOrEqual(0.18);
        expect(patch.errorCorrection).toBe('H');
    });

    it('increases margin to 2 when too small', () => {
        const cfg = makeCfg({ margin: 0 });
        const patch = autoFixLogic(cfg);
        expect(patch.margin).toBe(2);
    });

    it('returns empty patch when everything acceptable', () => {
        const cfg = makeCfg({ foreground: '#000000', background: '#ffffff', logoSizeRatio: 0.15, errorCorrection: 'H', margin: 4 });
        const patch = autoFixLogic(cfg);
        expect(Object.keys(patch).length).toBe(0);
    });
});
