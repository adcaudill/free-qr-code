import { z } from 'zod';

export const urlSchema = z.string().trim().transform(v => v === '' ? v : normalizeUrl(v)).refine(v => !v || isProbablyUrl(v), {
    message: 'Enter a valid URL (https://example.com)'
});

export function isProbablyUrl(input: string): boolean {
    try {
        new URL(input);
        return true;
    } catch {
        return false;
    }
}

export function normalizeUrl(raw: string): string {
    if (!raw) return '';
    // Prepend https:// if missing protocol and contains a dot
    if (!/^https?:\/\//i.test(raw) && /\./.test(raw)) {
        return 'https://' + raw;
    }
    return raw;
}
