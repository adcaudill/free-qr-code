import { useCallback, useEffect, useRef, useState } from 'react';
import type { QrConfig } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QrCodeStylingType = any;

interface UseQrCodeReturn {
    ref: React.RefObject<HTMLDivElement>;
    toPng: () => Promise<Blob | null>;
    toSvg: () => Promise<Blob | null>;
    isReady: boolean;
}

export function useQrCode(config: QrConfig): UseQrCodeReturn {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<QrCodeStylingType | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Lazy load library once
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!instanceRef.current) {
                const mod = await import('qr-code-styling');
                const QrCodeStyling = (mod as any).default || mod; // dynamic
                instanceRef.current = new QrCodeStyling({
                    width: config.size,
                    height: config.size,
                    type: 'svg',
                    data: config.text || 'https://',
                    margin: config.margin,
                    qrOptions: { errorCorrectionLevel: config.errorCorrection },
                    backgroundOptions: { color: config.background },
                    dotsOptions: { color: config.foreground, type: 'rounded' },
                });
            }
            if (!cancelled && containerRef.current && instanceRef.current) {
                containerRef.current.innerHTML = '';
                instanceRef.current.append(containerRef.current);
                setIsReady(true);
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Debounced update on config changes
    useEffect(() => {
        if (!instanceRef.current) return;
        const handle = setTimeout(() => {
            instanceRef.current?.update({
                width: config.size,
                height: config.size,
                data: config.text || 'https://',
                margin: config.margin,
                qrOptions: { errorCorrectionLevel: config.errorCorrection },
                backgroundOptions: { color: config.background },
                dotsOptions: { color: config.foreground },
            });
            if (config.logoFile) {
                const file = config.logoFile;
                const reader = new FileReader();
                reader.onload = () => {
                    instanceRef.current?.update({
                        image: reader.result as string,
                        imageOptions: {
                            crossOrigin: 'anonymous',
                            hideBackgroundDots: false,
                            imageSize: config.logoSizeRatio,
                            margin: 2
                        }
                    });
                };
                reader.readAsDataURL(file);
            } else {
                instanceRef.current.update({ image: undefined });
            }
        }, 200); // 200ms debounce
        return () => clearTimeout(handle);
    }, [config]);

    const toPng = useCallback(async () => {
        if (!instanceRef.current) return null;
        return await instanceRef.current.getRawData('png');
    }, []);

    const toSvg = useCallback(async () => {
        if (!instanceRef.current) return null;
        return await instanceRef.current.getRawData('svg');
    }, []);

    return { ref: containerRef, toPng, toSvg, isReady };
}
