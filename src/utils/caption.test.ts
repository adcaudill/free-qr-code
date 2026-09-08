import { describe, it, expect } from 'vitest';
import { applyCaption, hasCaption, svgSize } from './caption';
import { defaultConfig, QrConfig } from '../types';

const SVG_NS = 'http://www.w3.org/2000/svg';

// jsdom has no canvas, so measureText falls back to its estimate of
// 0.6em per character - which keeps these numbers predictable.
const ESTIMATE = 0.6;

function qrSvg(size = 256): SVGElement {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    const dot = document.createElementNS(SVG_NS, 'rect');
    dot.setAttribute('id', 'a-qr-module');
    svg.appendChild(dot);
    return svg;
}

function cfg(overrides: Partial<QrConfig> = {}): QrConfig {
    return { ...defaultConfig, ...overrides };
}

const label = (svg: SVGElement) => svg.querySelector('text')!;
const group = (svg: SVGElement) => svg.querySelector('g')!;

describe('caption', () => {
    it('reports whether there is anything to draw', () => {
        expect(hasCaption(cfg())).toBe(false);
        expect(hasCaption(cfg({ captionText: '   ' }))).toBe(false);
        expect(hasCaption(cfg({ captionText: 'Widget' }))).toBe(true);
    });

    it('leaves the svg alone when there is no text', () => {
        const svg = qrSvg();
        expect(applyCaption(svg, cfg({ captionText: '  ' }))).toBeNull();
        expect(svg.getAttribute('height')).toBe('256');
        expect(svg.querySelector('text')).toBeNull();
    });

    it('grows the canvas downwards and centres the text below the code', () => {
        const svg = qrSvg(256);
        const layout = applyCaption(svg, cfg({ captionText: 'Widget 9000', captionFontSize: 16, captionOffset: 8 }));

        // band = offset + 1.3em = 8 + 20.8
        expect(layout).toEqual({ width: 256, height: 285 });
        expect(svg.getAttribute('height')).toBe('285');
        expect(svg.getAttribute('width')).toBe('256');
        expect(svg.getAttribute('viewBox')).toBe('0 0 256 285');

        expect(label(svg).textContent).toBe('Widget 9000');
        expect(label(svg).getAttribute('text-anchor')).toBe('middle');
        expect(label(svg).getAttribute('x')).toBe('128');
        // baseline sits offset below the code, plus one em for the ascender
        expect(label(svg).getAttribute('y')).toBe('280');
        // the code itself does not move
        expect(group(svg).getAttribute('transform')).toBe('translate(0, 0)');
    });

    it('pushes the code down when the caption goes above', () => {
        const svg = qrSvg(256);
        applyCaption(svg, cfg({ captionText: 'Widget', captionPosition: 'above', captionFontSize: 16, captionOffset: 8 }));

        expect(svg.getAttribute('height')).toBe('285');
        expect(group(svg).getAttribute('transform')).toBe('translate(0, 28.8)');
        // baseline leaves the offset as a gap between descender and code
        expect(label(svg).getAttribute('y')).toBe('16');
    });

    it('moves what the library drew into the offset group', () => {
        const svg = qrSvg();
        applyCaption(svg, cfg({ captionText: 'Widget' }));
        expect(group(svg).querySelector('#a-qr-module')).not.toBeNull();
        expect(svg.querySelector(':scope > #a-qr-module')).toBeNull();
    });

    it('paints a background behind the whole thing, not just the code', () => {
        const svg = qrSvg(256);
        applyCaption(svg, cfg({ captionText: 'Widget', background: '#ff0000' }));
        const background = svg.querySelector('rect')!;
        expect(background.getAttribute('fill')).toBe('#ff0000');
        expect(background.getAttribute('width')).toBe('256');
        expect(background.getAttribute('height')).toBe('285');
        // and it is behind everything else
        expect(svg.firstElementChild).toBe(background);
    });

    it('widens rather than clipping a caption longer than the code', () => {
        const text = 'A product name that runs well past the edge of the code';
        const svg = qrSvg(256);
        const layout = applyCaption(svg, cfg({ captionText: text, captionFontSize: 16 }))!;

        const expected = Math.ceil(text.length * 16 * ESTIMATE + 16);
        expect(layout.width).toBe(expected);
        expect(layout.width).toBeGreaterThan(256);
        // the code stays centred in the wider canvas
        expect(group(svg).getAttribute('transform')).toBe(`translate(${(expected - 256) / 2}, 0)`);
        expect(label(svg).getAttribute('x')).toBe(String(expected / 2));
    });

    it('carries the font, size and colour through', () => {
        const svg = qrSvg();
        applyCaption(svg, cfg({ captionText: 'Widget', captionFontFamily: 'Georgia, serif', captionFontSize: 22, captionColor: '#123456' }));
        expect(label(svg).getAttribute('font-family')).toBe('Georgia, serif');
        expect(label(svg).getAttribute('font-size')).toBe('22');
        expect(label(svg).getAttribute('fill')).toBe('#123456');
    });

    it.each([
        ['normal', 'normal', 'normal'],
        ['bold', 'bold', 'normal'],
        ['italic', 'normal', 'italic'],
        ['bold-italic', 'bold', 'italic']
    ] as const)('renders %s as weight %s and style %s', (choice, weight, style) => {
        const svg = qrSvg();
        applyCaption(svg, cfg({ captionText: 'Widget', captionFontStyle: choice }));
        expect(label(svg).getAttribute('font-weight')).toBe(weight);
        expect(label(svg).getAttribute('font-style')).toBe(style);
    });

    it('reads the outer size back off a serialised svg', () => {
        expect(svgSize('<svg width="592" height="285" viewBox="0 0 592 285">')).toEqual({ width: 592, height: 285 });
        expect(svgSize('<svg viewBox="0 0 10 10">')).toBeNull();
    });
});
