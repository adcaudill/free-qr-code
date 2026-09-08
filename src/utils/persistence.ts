import { z } from 'zod';
import { defaultConfig, QrConfig, QUIET_ZONE_MAX } from '../types';

const STORAGE_KEY = 'freeqr-config';

// A cropped logo is a base64 data URL and localStorage is a ~5MB budget shared
// with everything else on the origin, so oversized logos are simply not kept.
const MAX_LOGO_CHARS = 512 * 1024;

// Everything is optional so a config written by an older build still restores
// what it can instead of being thrown away wholesale.
const storedSchema = z.object({
    contentType: z.enum(['url', 'wifi', 'vcard', 'sms']),
    url: z.string(),
    wifi: z.object({
        ssid: z.string(),
        security: z.enum(['WPA', 'WEP', 'nopass']),
        hidden: z.boolean()
    }).partial(),
    vcard: z.object({
        firstName: z.string(), lastName: z.string(), org: z.string(),
        title: z.string(), phone: z.string(), email: z.string(), url: z.string()
    }).partial(),
    sms: z.object({ phone: z.string(), message: z.string() }).partial(),
    dotStyle: z.enum(['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded']),
    cornerSquareStyle: z.enum(['square', 'extra-rounded']),
    cornerDotStyle: z.enum(['dot', 'square']),
    useGradient: z.boolean(),
    gradientColor: z.string(),
    gradientType: z.enum(['linear', 'radial']),
    gradientRotation: z.number(),
    size: z.number(),
    errorCorrection: z.enum(['L', 'M', 'Q', 'H']),
    margin: z.number(),
    foreground: z.string(),
    background: z.string(),
    logoCroppedDataUrl: z.string(),
    logoSizeRatio: z.number(),
    logoColorOverlay: z.boolean(),
    logoColor: z.string(),
    format: z.enum(['png', 'svg'])
}).partial();

export function loadConfig(): QrConfig {
    let stored: z.infer<typeof storedSchema>;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...defaultConfig };
        const parsed = storedSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) return { ...defaultConfig };
        stored = parsed.data;
    } catch {
        // unavailable storage (private mode, blocked cookies) or corrupt JSON
        return { ...defaultConfig };
    }
    return {
        ...defaultConfig,
        ...stored,
        // nested objects merge field by field so a partial restore keeps the defaults
        wifi: { ...defaultConfig.wifi!, ...stored.wifi },
        vcard: { ...defaultConfig.vcard!, ...stored.vcard },
        sms: { ...defaultConfig.sms!, ...stored.sms },
        // the margin used to be stored in pixels and is now in modules, so an
        // old value can be far outside the range the control offers
        margin: Math.min(QUIET_ZONE_MAX, Math.max(0, stored.margin ?? defaultConfig.margin)),
        text: ''
    };
}

export function saveConfig(config: QrConfig): void {
    // Listed field by field on purpose. What is left out: logoFile (a File
    // object), text (derived from the content fields) and the WiFi password,
    // which is a credential and stays in memory for the session only.
    const stored: z.infer<typeof storedSchema> = {
        contentType: config.contentType,
        url: config.url,
        wifi: config.wifi && { ssid: config.wifi.ssid, security: config.wifi.security, hidden: config.wifi.hidden },
        vcard: config.vcard,
        sms: config.sms,
        dotStyle: config.dotStyle,
        cornerSquareStyle: config.cornerSquareStyle,
        cornerDotStyle: config.cornerDotStyle,
        useGradient: config.useGradient,
        gradientColor: config.gradientColor,
        gradientType: config.gradientType,
        gradientRotation: config.gradientRotation,
        size: config.size,
        errorCorrection: config.errorCorrection,
        margin: config.margin,
        foreground: config.foreground,
        background: config.background,
        logoSizeRatio: config.logoSizeRatio,
        logoColorOverlay: config.logoColorOverlay,
        logoColor: config.logoColor,
        format: config.format
    };
    if (config.logoCroppedDataUrl && config.logoCroppedDataUrl.length <= MAX_LOGO_CHARS) {
        stored.logoCroppedDataUrl = config.logoCroppedDataUrl;
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
        // out of quota or storage unavailable; persistence is a convenience only
    }
}

export function clearConfig(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // nothing to do if storage is unavailable
    }
}
