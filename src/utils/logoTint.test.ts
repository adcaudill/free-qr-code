import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tintLogo } from './logoTint';

// jsdom has no canvas, so the drawing surface is recorded instead: what matters
// is that the logo is drawn first and then filled through source-in, which is
// what keeps the alpha mask and replaces the colours.
interface Recorded { calls: string[]; composite: string[]; fill: string[] }

function stubCanvas(withContext = true) {
    const recorded: Recorded = { calls: [], composite: [], fill: [] };
    const ctx = {
        _composite: '',
        _fill: '',
        set globalCompositeOperation(v: string) { this._composite = v; recorded.composite.push(v); },
        get globalCompositeOperation() { return this._composite; },
        set fillStyle(v: string) { this._fill = v; recorded.fill.push(v); },
        get fillStyle() { return this._fill; },
        drawImage: () => { recorded.calls.push('drawImage'); },
        fillRect: (...a: number[]) => { recorded.calls.push(`fillRect(${a.join(',')})`); }
    };
    const original = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
        if (tag !== 'canvas') return original(tag);
        return {
            width: 0,
            height: 0,
            getContext: () => (withContext ? ctx : null),
            toDataURL: () => 'data:image/png;base64,TINTED'
        } as unknown as HTMLCanvasElement;
    }) as typeof document.createElement);
    return recorded;
}

class FakeImage {
    width = 32;
    height = 16;
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;
    private _src = '';
    set src(v: string) {
        this._src = v;
        setTimeout(() => (v === 'broken' ? this.onerror?.() : this.onload?.()), 0);
    }
    get src() { return this._src; }
}

const SRC = 'data:image/png;base64,AAAA';

describe('tintLogo', () => {
    beforeEach(() => { global.Image = FakeImage as unknown as typeof Image; });
    afterEach(() => { vi.restoreAllMocks(); });

    it('draws the logo, then fills it through source-in with the colour', async () => {
        const recorded = stubCanvas();
        const result = await tintLogo(SRC, '#1976d2');
        expect(recorded.calls).toEqual(['drawImage', 'fillRect(0,0,32,16)']);
        expect(recorded.composite).toEqual(['source-in']);
        expect(recorded.fill).toEqual(['#1976d2']);
        expect(result).toBe('data:image/png;base64,TINTED');
    });

    it('reuses the last result instead of redrawing', async () => {
        stubCanvas();
        await tintLogo(SRC, '#ff0000');
        const recorded = stubCanvas();
        await tintLogo(SRC, '#ff0000');
        expect(recorded.calls).toEqual([]);
    });

    it('redraws when the colour changes', async () => {
        stubCanvas();
        await tintLogo(SRC, '#ff0000');
        const recorded = stubCanvas();
        await tintLogo(SRC, '#00ff00');
        expect(recorded.fill).toEqual(['#00ff00']);
    });

    it('falls back to the untinted logo when there is no 2d context', async () => {
        stubCanvas(false);
        expect(await tintLogo('data:image/png;base64,NOCTX', '#000000')).toBe('data:image/png;base64,NOCTX');
    });

    it('falls back to the untinted logo when the image will not load', async () => {
        stubCanvas();
        expect(await tintLogo('broken', '#000000')).toBe('broken');
    });
});
