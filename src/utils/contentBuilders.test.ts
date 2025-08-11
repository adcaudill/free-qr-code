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
    it('builds SMS without message', () => {
        const c = makeConfig({ contentType: 'sms', sms: { phone: '+19998887777', message: '' } });
        expect(buildQrData(c)).toBe('SMSTO:+19998887777');
    });
    it('escapes special characters in WiFi fields', () => {
        const c = makeConfig({ contentType: 'wifi', wifi: { ssid: 'Cafe;Net:1,2\\', password: 'p@ss;:,"', security: 'WPA', hidden: false } });
        const data = buildQrData(c);
        expect(data).toContain('S:Cafe\\;Net\\:1\\,2\\\\;');
        expect(data).toContain('P:p@ss\\;\\:\\,\\";');
    });
    it('builds full vCard with optional fields', () => {
        const c = makeConfig({ contentType: 'vcard', vcard: { firstName: 'Grace', lastName: 'Hopper', org: 'Navy', title: 'Rear Admiral', phone: '+123', email: 'grace@example.com', url: 'example.com' } });
        const data = buildQrData(c);
        expect(data).toContain('ORG:Navy');
        expect(data).toContain('TITLE:Rear Admiral');
        expect(data).toContain('TEL;TYPE=CELL:+123');
        expect(data).toContain('EMAIL:grace@example.com');
        expect(data).toContain('URL:https://example.com');
    });
});
