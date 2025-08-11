declare module 'qr-code-styling' {
    interface QrOptions { errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'; }
    interface UpdateOptions {
        width?: number;
        height?: number;
        data?: string;
        margin?: number;
        qrOptions?: QrOptions;
        backgroundOptions?: { color?: string };
        dotsOptions?: { color?: string; type?: string };
        image?: string;
        imageOptions?: {
            hideBackgroundDots?: boolean;
            imageSize?: number; // ratio 0-1 maybe library uses absolute but we map
            margin?: number;
            crossOrigin?: string;
        };
        type?: 'svg' | 'canvas';
    }
    export default class QRCodeStyling {
        constructor(options: UpdateOptions);
        append(element: HTMLElement): void;
        update(options: UpdateOptions): void;
        getRawData(extension: 'png' | 'svg'): Promise<Blob>;
    }
}
