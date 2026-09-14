import { useCallback, useEffect, useRef, useState } from 'react';
import type { QrConfig } from '../types';
import { buildQrData } from '../utils/contentBuilders';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QrCodeStylingType = any;

function dotsOptions(config: QrConfig) {
    if (config.useGradient) {
        return {
            type: config.dotStyle,
            color: config.foreground,
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
    // gradient must be sent explicitly as undefined: qr-code-styling deep-merges
    // update() patches, so an earlier gradient survives a patch that only carries
    // a color and keeps overriding it.
    return { type: config.dotStyle, color: config.foreground, gradient: undefined };
}

// Full option set for the library. Every field is always sent so nothing can be
// left over from a previous state by the deep merge. Async because both the logo
// and the quiet zone conversion are resolved on the way in - the latter pulls in
// qrcode-generator, which is kept out of the initial bundle.
async function buildOptions(config: QrConfig) {
    const data = buildQrData(config) || 'https://';
    const [image, { quietZoneToPixels }] = await Promise.all([
        resolveLogo(config),
        import('../utils/quietZone')
    ]);
    return {
        width: config.size,
        height: config.size,
        type: 'svg',
        data,
        margin: quietZoneToPixels(config.margin, config.size, data, config.errorCorrection),
        qrOptions: { errorCorrectionLevel: config.errorCorrection },
        backgroundOptions: { color: config.background },
        dotsOptions: dotsOptions(config),
        cornersSquareOptions: { type: config.cornerSquareStyle, color: config.foreground },
        cornersDotOptions: { type: config.cornerDotStyle, color: config.foreground },
        image,
        imageOptions: {
            hideBackgroundDots: true,
            imageSize: config.logoSizeRatio,
            margin: 4,
            // the logo is already a data URL, so there is nothing to re-fetch
            saveAsBlob: false
        }
    };
}

// Resolve the logo to a data URL. logoCroppedDataUrl is what the cropper
// produces; logoFile is the raw fallback.
function resolveLogo(config: QrConfig): Promise<string | undefined> {
    if (config.logoCroppedDataUrl) return Promise.resolve(config.logoCroppedDataUrl);
    const file = config.logoFile;
    if (!file) return Promise.resolve(undefined);
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : undefined);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
    });
}

async function loadLibrary(): Promise<QrCodeStylingType | null> {
    // In certain test/SSR teardown phases window can be undefined; bail early.
    if (typeof window === 'undefined') return null;
    try {
        const mod = await import('qr-code-styling');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (mod as any).default || mod;
    } catch {
        // Swallow import errors in non-browser contexts.
        return null;
    }
}

interface UseQrCodeReturn {
    ref: React.RefObject<HTMLDivElement | null>;
    toPng: () => Promise<Blob | null>;
    toSvg: () => Promise<Blob | null>;
    isReady: boolean;
}

export function useQrCode(config: QrConfig): UseQrCodeReturn {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<QrCodeStylingType | null>(null);
    const [isReady, setIsReady] = useState(false);
    const debounceTimerRef = useRef<number | null>(null);

    // Exports and the debounced update must always see the newest config, never
    // the one captured when the callback was created.
    const configRef = useRef(config);
    configRef.current = config;

    const applyConfig = useCallback(async () => {
        const instance = instanceRef.current;
        if (!instance) return;
        const options = await buildOptions(configRef.current);
        if (!instanceRef.current) return;
        instance.update(options);
    }, []);

    // Lazy load library once
    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!instanceRef.current) {
                const QrCodeStyling = await loadLibrary();
                if (cancelled || !QrCodeStyling) return;
                const options = await buildOptions(configRef.current);
                if (cancelled) return;
                instanceRef.current = new QrCodeStyling(options);
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

    // Debounced preview update on config changes
    useEffect(() => {
        if (!instanceRef.current) return;
        if (debounceTimerRef.current !== null) window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = window.setTimeout(() => {
            debounceTimerRef.current = null;
            void applyConfig();
        }, 200);
    }, [config, applyConfig]);

    useEffect(() => () => {
        if (debounceTimerRef.current !== null) window.clearTimeout(debounceTimerRef.current);
    }, []);

    // Exports render from a throwaway instance built from the current config.
    // The preview instance is not usable here: it may have a debounced update in
    // flight, and the library caches the svg it already rendered (and the canvas
    // it derived from it) between getRawData calls, so it hands back a stale
    // image - which is how an SVG export lost the logo.
    const exportBlob = useCallback(async (extension: 'png' | 'svg'): Promise<Blob | null> => {
        const QrCodeStyling = await loadLibrary();
        if (!QrCodeStyling) return null;
        const instance = new QrCodeStyling(await buildOptions(configRef.current));
        return await instance.getRawData(extension);
    }, []);

    const toPng = useCallback(() => exportBlob('png'), [exportBlob]);
    const toSvg = useCallback(() => exportBlob('svg'), [exportBlob]);

    return { ref: containerRef, toPng, toSvg, isReady };
}
