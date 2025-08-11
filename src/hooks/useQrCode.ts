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
    const imageLoadPromiseRef = useRef<Promise<void> | null>(null);

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

    // Helper to apply current config to instance
    const applyConfig = useCallback(() => {
        if (!instanceRef.current) return;
        // Base QR update
        instanceRef.current.update({
            width: config.size,
            height: config.size,
            data: config.text || 'https://',
            margin: config.margin,
            qrOptions: { errorCorrectionLevel: config.errorCorrection },
            backgroundOptions: { color: config.background },
            dotsOptions: { color: config.foreground },
            image: undefined
        });

        // Handle logo (cropped preferred)
        const setImage = (src: string) => {
            const img = new Image();
            // Data URLs don't need crossOrigin; leave unset improves reliability
            imageLoadPromiseRef.current = new Promise(resolve => {
                img.onload = () => {
                    instanceRef.current?.update({
                        image: src,
                        imageOptions: {
                            hideBackgroundDots: true,
                            imageSize: config.logoSizeRatio,
                            margin: 4
                        }
                    });
                    resolve();
                };
                img.onerror = () => {
                    // Fallback: still resolve so downloads proceed (will show white box if truly broken)
                    resolve();
                };
            });
            img.src = src;
        };

        if (config.logoCroppedDataUrl) {
            setImage(config.logoCroppedDataUrl);
        } else if (config.logoFile) {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') setImage(reader.result);
            };
            reader.readAsDataURL(config.logoFile);
        } else {
            imageLoadPromiseRef.current = null;
        }
    }, [config]);

    // Immediate update on config changes (debounce removed to avoid race with export)
    useEffect(() => {
        if (!instanceRef.current) return;
        applyConfig();
    }, [applyConfig]);

    const toPng = useCallback(async () => {
        if (!instanceRef.current) return null;
        if (imageLoadPromiseRef.current) await imageLoadPromiseRef.current;
        return await instanceRef.current.getRawData('png');
    }, []);

    const toSvg = useCallback(async () => {
        if (!instanceRef.current) return null;
        if (imageLoadPromiseRef.current) await imageLoadPromiseRef.current;
        return await instanceRef.current.getRawData('svg');
    }, []);

    return { ref: containerRef, toPng, toSvg, isReady };
}
