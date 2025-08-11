import { describe, it, expect } from 'vitest';
import { buildQrData } from './contentBuilders';
import { defaultConfig } from '../types';

function makeConfig(partial: any) { return { ...defaultConfig, ...partial }; }

describe('buildQrData', () => {
    it('builds URL', () => {
        const c = makeConfig({ contentType: 'url', url: 'example.com' });
        expect(buildQrData(c)).toBe('https://example.com');
    });
    it('builds WiFi WPA', () => {
        const c = makeConfig({ contentType: 'wifi', wifi: { ssid: 'MyNet', password: 'Secret', security: 'WPA', hidden: false } });
        expect(buildQrData(c)).toBe('WIFI:S:MyNet;T:WPA;P:Secret;;');
    });
    it('builds WiFi open hidden', () => {
        const c = makeConfig({ contentType: 'wifi', wifi: { ssid: 'Open', password: '', security: 'nopass', hidden: true } });
        expect(buildQrData(c)).toBe('WIFI:S:Open;T:;H:true;;');
    });
    it('builds vCard basic', () => {
        const c = makeConfig({ contentType: 'vcard', vcard: { firstName: 'Ada', lastName: 'Lovelace', org: 'Math', title: '', phone: '', email: '', url: '' } });
        const data = buildQrData(c);
        expect(data).toContain('BEGIN:VCARD');
        expect(data).toContain('FN:Ada Lovelace');
    });
    it('builds SMS with message', () => {
        const c = makeConfig({ contentType: 'sms', sms: { phone: '+15551234567', message: 'Hello World' } });
        expect(buildQrData(c)).toBe('SMSTO:+15551234567:Hello%20World');
    });
});
