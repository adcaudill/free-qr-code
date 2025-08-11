import { QrConfig } from '../types';
import { normalizeUrl } from './validation';

// Build the QR payload string based on content type.
export function buildQrData(config: QrConfig): string {
    switch (config.contentType) {
        case 'url':
            return config.url ? normalizeUrl(config.url) : '';
        case 'wifi': {
            const w = config.wifi!;
            const enc = (v: string) => v.replace(/([;,:\\"])/g, '\\$1');
            const parts = [
                'WIFI:',
                `S:${enc(w.ssid)};`,
                w.security !== 'nopass' ? `T:${w.security};` : 'T:;'
            ];
            if (w.security !== 'nopass') parts.push(`P:${enc(w.password)};`);
            if (w.hidden) parts.push('H:true;');
            parts.push(';');
            return parts.join('');
        }
        case 'vcard': {
            const v = config.vcard!;
            // vCard 3.0 basic
            return [
                'BEGIN:VCARD',
                'VERSION:3.0',
                `N:${v.lastName};${v.firstName};;;`,
                `FN:${v.firstName} ${v.lastName}`.trim(),
                v.org ? `ORG:${v.org}` : '',
                v.title ? `TITLE:${v.title}` : '',
                v.phone ? `TEL;TYPE=CELL:${v.phone}` : '',
                v.email ? `EMAIL:${v.email}` : '',
                v.url ? `URL:${normalizeUrl(v.url)}` : '',
                'END:VCARD'
            ].filter(Boolean).join('\n');
        }
        case 'sms': {
            const s = config.sms!;
            if (!s.phone) return '';
            const msg = s.message ? encodeURIComponent(s.message) : '';
            return msg ? `SMSTO:${s.phone}:${msg}` : `SMSTO:${s.phone}`;
        }
        default:
            return '';
    }
}
