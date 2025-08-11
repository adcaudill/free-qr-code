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
    margin: number; // quiet zone
    foreground: string; // hex
    background: string; // hex
    logoFile?: File;
    logoCroppedDataUrl?: string; // optional processed/cropped image
    logoSizeRatio: number; // 0 - 0.5 typically
    format: 'png' | 'svg';
}

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
    format: 'png'
};
