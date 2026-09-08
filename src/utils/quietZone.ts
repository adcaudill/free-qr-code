import qrcode from 'qrcode-generator';
import type { ErrorCorrectionLevel } from '../types';

// qr-code-styling takes `margin` as a minimum gap in pixels, then sizes each
// module with Math.floor((size - 2 * margin) / moduleCount) and centres the
// result. The floor means whole ranges of pixel margins collapse onto the same
// layout - at 512px, margins 0 through 4 all render identically - so a pixel
// margin is not a control anyone can use.
//
// The quiet zone is specified in modules (4 is the QR standard), so that is what
// the app stores. Converting it back to the pixel margin the library wants makes
// every step of the control produce a different, predictable result.

// Same heuristic qr-code-styling uses to pick an encoding mode, so the module
// count computed here matches the one it will produce.
function getMode(data: string): 'Numeric' | 'Alphanumeric' | 'Byte' {
    switch (true) {
        case /^[0-9]*$/.test(data): return 'Numeric';
        case /^[0-9A-Z $%*+\-./:]*$/.test(data): return 'Alphanumeric';
        default: return 'Byte';
    }
}

export function moduleCount(data: string, errorCorrection: ErrorCorrectionLevel): number | null {
    try {
        const qr = qrcode(0, errorCorrection);
        qr.addData(data, getMode(data));
        qr.make();
        return qr.getModuleCount();
    } catch {
        // data too long for any version; the library will report it downstream
        return null;
    }
}

/**
 * Pixel margin that leaves at least `modules` modules of quiet zone on each side.
 * Falls back to treating the value as pixels if the module count is unavailable.
 */
export function quietZoneToPixels(
    modules: number,
    size: number,
    data: string,
    errorCorrection: ErrorCorrectionLevel
): number {
    const count = moduleCount(data, errorCorrection);
    if (!count) return modules;
    // Largest module size that still leaves the requested quiet zone, then the
    // margin that makes the library's floor() land on exactly that module size.
    const dotSize = Math.max(1, Math.floor(size / (count + 2 * Math.max(0, modules))));
    return Math.max(0, Math.floor((size - count * dotSize) / 2));
}
