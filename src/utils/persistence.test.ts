import { describe, it, expect, beforeEach } from 'vitest';
import { clearConfig, loadConfig, saveConfig } from './persistence';
import { defaultConfig, QrConfig } from '../types';

const KEY = 'freeqr-config';

function cfg(overrides: Partial<QrConfig>): QrConfig {
    return { ...defaultConfig, ...overrides };
}

describe('persistence', () => {
    beforeEach(() => localStorage.clear());

    it('returns defaults when nothing is stored', () => {
        expect(loadConfig()).toEqual(defaultConfig);
    });

    it('round-trips content and styling', () => {
        saveConfig(cfg({
            contentType: 'sms',
            url: 'example.com',
            sms: { phone: '+15551234', message: 'hi' },
            useGradient: true,
            gradientColor: '#123456',
            size: 2048,
            logoSizeRatio: 0.8,
            format: 'svg'
        }));
        const loaded = loadConfig();
        expect(loaded.contentType).toBe('sms');
        expect(loaded.url).toBe('example.com');
        expect(loaded.sms).toEqual({ phone: '+15551234', message: 'hi' });
        expect(loaded.useGradient).toBe(true);
        expect(loaded.gradientColor).toBe('#123456');
        expect(loaded.size).toBe(2048);
        expect(loaded.logoSizeRatio).toBe(0.8);
        expect(loaded.format).toBe('svg');
    });

    it('keeps the WiFi network but never the password', () => {
        saveConfig(cfg({ wifi: { ssid: 'home', password: 'hunter2', security: 'WPA', hidden: true } }));
        expect(localStorage.getItem(KEY)).not.toContain('hunter2');
        const loaded = loadConfig();
        expect(loaded.wifi).toEqual({ ssid: 'home', password: '', security: 'WPA', hidden: true });
    });

    it('round-trips the logo colour overlay', () => {
        saveConfig(cfg({ logoColorOverlay: true, logoColor: '#1976d2' }));
        const loaded = loadConfig();
        expect(loaded.logoColorOverlay).toBe(true);
        expect(loaded.logoColor).toBe('#1976d2');
    });

    it('keeps a small logo and drops an oversized one', () => {
        const small = 'data:image/png;base64,AAAA';
        saveConfig(cfg({ logoCroppedDataUrl: small }));
        expect(loadConfig().logoCroppedDataUrl).toBe(small);

        saveConfig(cfg({ logoCroppedDataUrl: 'data:image/png;base64,' + 'A'.repeat(512 * 1024) }));
        expect(loadConfig().logoCroppedDataUrl).toBeUndefined();
    });

    it('falls back to defaults on corrupt or invalid stored data', () => {
        localStorage.setItem(KEY, 'not json');
        expect(loadConfig()).toEqual(defaultConfig);

        localStorage.setItem(KEY, JSON.stringify({ dotStyle: 'triangles' }));
        expect(loadConfig()).toEqual(defaultConfig);
    });

    it('fills in fields missing from an older stored config', () => {
        localStorage.setItem(KEY, JSON.stringify({ foreground: '#ff0000', wifi: { ssid: 'old' } }));
        const loaded = loadConfig();
        expect(loaded.foreground).toBe('#ff0000');
        expect(loaded.wifi).toEqual({ ssid: 'old', password: '', security: 'WPA', hidden: false });
        expect(loaded.dotStyle).toBe(defaultConfig.dotStyle);
    });

    it('clamps a margin left over from when it was stored in pixels', () => {
        localStorage.setItem(KEY, JSON.stringify({ margin: 32 }));
        expect(loadConfig().margin).toBe(16);
    });

    it('clears stored settings', () => {
        saveConfig(cfg({ foreground: '#ff0000' }));
        clearConfig();
        expect(loadConfig()).toEqual(defaultConfig);
    });
});
