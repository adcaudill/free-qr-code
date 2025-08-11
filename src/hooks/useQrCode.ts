import { useCallback, useEffect, useRef, useState } from 'react';
import type { QrConfig } from '../types';
import { buildQrData } from '../utils/contentBuilders';

function gradientOrSolidDots(config: QrConfig) {
    if (config.useGradient) {
        return {
            type: config.dotStyle,
            gradient: {
                type: config.gradientType,
                rotation: (config.gradientRotation * Math.PI) / 180,
                colorStops: [
                    { offset: 0, color: config.foreground },
                    { offset: 1, color: config.gradientColor }
                ]
            }
        };
    }
    return { color: config.foreground, type: config.dotStyle };
}

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
    const debounceTimerRef = useRef<number | null>(null);
    const updatePromiseRef = useRef<Promise<void> | null>(null);
    const updateResolveRef = useRef<(() => void) | null>(null);

    // Lazy load library once
    useEffect(() => {
        let cancelled = false;
        (async () => {
            // In certain test/SSR teardown phases window can be undefined; bail early.
            if (typeof window === 'undefined') return;
            if (!instanceRef.current) {
                try {
                    const mod = await import('qr-code-styling');
                    if (cancelled || typeof window === 'undefined') return;
                    const QrCodeStyling = (mod as any).default || mod; // dynamic
                    instanceRef.current = new QrCodeStyling({
                        width: config.size,
                        height: config.size,
                        type: 'svg',
                        data: buildQrData(config) || 'https://',
                        margin: config.margin,
                        qrOptions: { errorCorrectionLevel: config.errorCorrection },
                        backgroundOptions: { color: config.background },
                        dotsOptions: gradientOrSolidDots(config),
                        cornersSquareOptions: { type: config.cornerSquareStyle, color: config.foreground },
                        cornersDotOptions: { type: config.cornerDotStyle, color: config.foreground }
                    });
                } catch {
                    // Swallow import errors in non-browser (tests/SSR) contexts; hook will remain not ready.
                    return;
                }
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
    function applyConfig() {
        if (!instanceRef.current) return;
        // Base QR update
        instanceRef.current.update({
            width: config.size,
            height: config.size,
            data: buildQrData(config) || 'https://',
            margin: config.margin,
            qrOptions: { errorCorrectionLevel: config.errorCorrection },
            backgroundOptions: { color: config.background },
            dotsOptions: gradientOrSolidDots(config),
            cornersSquareOptions: { type: config.cornerSquareStyle, color: config.foreground },
            cornersDotOptions: { type: config.cornerDotStyle, color: config.foreground },
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
    }

    const scheduleUpdate = useCallback(() => {
        if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
        updatePromiseRef.current = new Promise<void>(resolve => {
            updateResolveRef.current = resolve;
            debounceTimerRef.current = window.setTimeout(() => {
                applyConfig();
                if (imageLoadPromiseRef.current) {
                    imageLoadPromiseRef.current.then(() => { resolve(); updateResolveRef.current = null; });
                } else {
                    resolve();
                    updateResolveRef.current = null;
                }
            }, 200);
        });
    }, [config]);

    // Debounced update on config changes
    useEffect(() => {
        if (!instanceRef.current) return;
        scheduleUpdate();
    }, [scheduleUpdate]);

    const flushPending = async () => {
        if (debounceTimerRef.current) {
            window.clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
            applyConfig();
            // Resolve pending promise manually since timer callback won't fire
            if (updateResolveRef.current) {
                const r = updateResolveRef.current;
                updateResolveRef.current = null;
                r();
            }
        }
        if (imageLoadPromiseRef.current) await imageLoadPromiseRef.current;
        if (updatePromiseRef.current) await updatePromiseRef.current;
    };

    const toPng = useCallback(async () => {
        if (!instanceRef.current) return null;
        await flushPending();
        return await instanceRef.current.getRawData('png');
    }, []);

    const toSvg = useCallback(async () => {
        if (!instanceRef.current) return null;
        await flushPending();
        return await instanceRef.current.getRawData('svg');
    }, []);

    return { ref: containerRef, toPng, toSvg, isReady };
}
