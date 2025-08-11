import { describe, it, expect } from 'vitest';
import { normalizeUrl, isProbablyUrl } from './validation';

describe('normalizeUrl', () => {
    it('adds https when missing', () => {
        expect(normalizeUrl('example.com')).toBe('https://example.com');
    });
    it('keeps existing protocol', () => {
        expect(normalizeUrl('http://site.test')).toBe('http://site.test');
    });
});

describe('isProbablyUrl', () => {
    it('accepts valid http URL', () => {
        expect(isProbablyUrl('https://a.b')).toBe(true);
    });
    it('rejects invalid string', () => {
        expect(isProbablyUrl('nota url')).toBe(false);
    });
});
