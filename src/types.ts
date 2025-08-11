export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrConfig {
    text: string;
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
    size: 256,
    errorCorrection: 'M',
    margin: 4,
    foreground: '#000000',
    background: '#FFFFFF',
    logoSizeRatio: 0.2,
    format: 'png'
};
