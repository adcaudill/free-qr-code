import { describe, it, expect } from 'vitest';
import QRCodeStyling from 'qr-code-styling';
import { moduleCount, quietZoneToPixels } from './quietZone';

const URL_DATA = 'https://example.com';

// Distance from the canvas edge to the first drawn module, as the real library
// renders it.
async function renderedQuietZone(modules: number, size: number): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qr = new (QRCodeStyling as any)({
        width: size, height: size, type: 'svg', data: URL_DATA,
        margin: quietZoneToPixels(modules, size, URL_DATA, 'M'),
        qrOptions: { errorCorrectionLevel: 'M' },
        backgroundOptions: { color: '#FFFFFF' },
        dotsOptions: { color: '#000000', type: 'square' }
    });
    const svg = await (await qr.getRawData('svg') as Blob).text();
    const lefts = [...svg.matchAll(/<rect x="(-?\d+(?:\.\d+)?)"[^>]*width="(\d+(?:\.\d+)?)"/g)]
        .map(m => [parseFloat(m[1]), parseFloat(m[1]) + parseFloat(m[2])] as const)
        .filter(([x, right]) => !(x === 0 && right === size)) // drop the background rect
        .map(([x]) => x);
    return Math.min(...lefts);
}

describe('quietZone', () => {
    it('matches the module count qr-code-styling will produce', () => {
        expect(moduleCount(URL_DATA, 'M')).toBe(25);
        expect(moduleCount(URL_DATA, 'H')).toBe(29);
        expect(moduleCount('12345', 'M')).toBe(21);
    });

    it('returns null for data that cannot be encoded', () => {
        expect(moduleCount('x'.repeat(10000), 'H')).toBeNull();
    });

    it('grows the pixel margin for every extra module of quiet zone', () => {
        const px = [0, 1, 2, 4, 8, 16].map(m => quietZoneToPixels(m, 256, URL_DATA, 'M'));
        for (let i = 1; i < px.length; i++) {
            expect(px[i]).toBeGreaterThan(px[i - 1]);
        }
    });

    it('scales with the QR size', () => {
        expect(quietZoneToPixels(4, 512, URL_DATA, 'M'))
            .toBeGreaterThan(quietZoneToPixels(4, 256, URL_DATA, 'M'));
    });

    it('leaves at least the requested quiet zone once the library floors the module size', () => {
        for (const size of [128, 256, 300, 512, 1024]) {
            for (const modules of [1, 2, 4, 8]) {
                const margin = quietZoneToPixels(modules, size, URL_DATA, 'M');
                // what the library then computes
                const count = moduleCount(URL_DATA, 'M')!;
                const dotSize = Math.floor((size - 2 * margin) / count);
                const quiet = (size - count * dotSize) / 2;
                expect(quiet / dotSize).toBeGreaterThanOrEqual(modules);
            }
        }
    });

    it('falls back to the raw value when the data cannot be encoded', () => {
        expect(quietZoneToPixels(4, 256, 'x'.repeat(10000), 'H')).toBe(4);
    });

    // The library used to be handed a raw pixel margin, where 0 and 4 rendered
    // identically at 256px and 0 through 4 all rendered identically at 512px.
    it('renders a visibly different quiet zone for 0 and the default of 4', async () => {
        for (const size of [256, 512]) {
            expect(await renderedQuietZone(4, size)).toBeGreaterThan(await renderedQuietZone(0, size) * 3);
        }
    }, 20000);

    it('never shrinks the rendered quiet zone as the setting goes up', async () => {
        const measured: number[] = [];
        for (const modules of [0, 1, 2, 3, 4, 6, 8, 12, 16]) {
            measured.push(await renderedQuietZone(modules, 256));
        }
        for (let i = 1; i < measured.length; i++) {
            expect(measured[i]).toBeGreaterThanOrEqual(measured[i - 1]);
        }
        // integer module sizes mean adjacent steps can land on the same layout,
        // but the range as a whole has to move
        expect(measured.at(-1)!).toBeGreaterThan(measured[0] * 5);
    }, 20000);
});
