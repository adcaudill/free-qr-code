export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrConfig {
    text: string; // derived encoded text used by generator
    contentType: 'url' | 'wifi' | 'vcard' | 'sms';
    url?: string; // original user URL input
    wifi?: { ssid: string; password: string; security: 'WPA' | 'WEP' | 'nopass'; hidden: boolean };
    vcard?: { firstName: string; lastName: string; org: string; title: string; phone: string; email: string; url: string; }; // minimal vCard fields
    sms?: { phone: string; message: string };
    // Styling
    dotStyle: 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';
    cornerSquareStyle: 'square' | 'extra-rounded';
    cornerDotStyle: 'dot' | 'square';
    useGradient: boolean;
    gradientColor: string; // second color for gradient
    gradientType: 'linear' | 'radial';
    gradientRotation: number; // degrees 0-360
    size: number; // pixels
    errorCorrection: ErrorCorrectionLevel;
    margin: number; // quiet zone, in modules (squares); see utils/quietZone.ts
    foreground: string; // hex
    background: string; // hex
    logoFile?: File;
    logoCroppedDataUrl?: string; // optional processed/cropped image
    logoSizeRatio: number; // 0 - 1; the library scales this by the error correction level, so 1 is not a full cover
    logoColorOverlay: boolean; // recolor the logo to logoColor, keeping its shape
    logoColor: string; // hex, only used when logoColorOverlay is on
    // Caption drawn outside the QR itself; empty text means no caption at all
    captionText: string;
    captionPosition: 'above' | 'below';
    captionFontFamily: string; // css font stack, must resolve without a webfont
    captionFontStyle: 'normal' | 'bold' | 'italic' | 'bold-italic';
    captionFontSize: number; // px
    captionColor: string; // hex
    captionOffset: number; // px gap between the QR edge and the text
    format: 'png' | 'svg';
}

// Quiet zone bounds, in modules. 4 is the QR standard; past ~16 the code itself
// is squeezed into so little of the canvas that it stops being useful.
export const QUIET_ZONE_MAX = 16;

export const defaultConfig: QrConfig = {
    text: '',
    contentType: 'url',
    url: '',
    wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
    vcard: { firstName: '', lastName: '', org: '', title: '', phone: '', email: '', url: '' },
    sms: { phone: '', message: '' },
    dotStyle: 'rounded',
    cornerSquareStyle: 'square',
    cornerDotStyle: 'dot',
    useGradient: false,
    gradientColor: '#0055FF',
    gradientType: 'linear',
    gradientRotation: 0,
    size: 256,
    errorCorrection: 'M',
    margin: 4,
    foreground: '#000000',
    background: '#FFFFFF',
    logoSizeRatio: 0.2,
    logoColorOverlay: false,
    logoColor: '#1976d2',
    captionText: '',
    captionPosition: 'below',
    captionFontFamily: 'Arial, Helvetica, sans-serif',
    captionFontStyle: 'normal',
    captionFontSize: 16,
    captionColor: '#000000',
    captionOffset: 8,
    format: 'png'
};
