import type { QrConfig } from '../types';

// A caption lives outside the QR, so the svg qr-code-styling produced has to
// grow to make room for it. This runs as the library's drawing extension for the
// preview and again on the exported svg, so both come out identical.

const SVG_NS = 'http://www.w3.org/2000/svg';

// Stacks that resolve without a webfont. An svg rasterised through an <img> for
// PNG export cannot fetch fonts, so anything not installed locally silently
// falls back - keep every option to families that ship with the OS.
export const CAPTION_FONTS: { value: string; label: string }[] = [
    { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
    { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
    { value: '"Trebuchet MS", Helvetica, sans-serif', label: 'Trebuchet' },
    { value: 'Georgia, "Times New Roman", serif', label: 'Georgia' },
    { value: '"Times New Roman", Times, serif', label: 'Times' },
    { value: '"Courier New", Courier, monospace', label: 'Courier' }
];

export const CAPTION_FONT_STYLES: { value: QrConfig['captionFontStyle']; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'bold', label: 'Bold' },
    { value: 'italic', label: 'Italic' },
    { value: 'bold-italic', label: 'Bold italic' }
];

export interface CaptionLayout { width: number; height: number }

interface FontStyle { weight: 'normal' | 'bold'; style: 'normal' | 'italic' }

export function fontStyle(style: QrConfig['captionFontStyle']): FontStyle {
    return {
        weight: style === 'bold' || style === 'bold-italic' ? 'bold' : 'normal',
        style: style === 'italic' || style === 'bold-italic' ? 'italic' : 'normal'
    };
}

export function hasCaption(config: QrConfig): boolean {
    return config.captionText.trim().length > 0;
}

function measureText(text: string, config: QrConfig): number {
    const { weight, style } = fontStyle(config.captionFontStyle);
    try {
        const ctx = document.createElement('canvas').getContext('2d');
        if (ctx) {
            ctx.font = `${style} ${weight} ${config.captionFontSize}px ${config.captionFontFamily}`;
            const measured = ctx.measureText(text).width;
            if (measured > 0) return measured;
        }
    } catch {
        // no canvas (jsdom, locked-down contexts)
    }
    // rough proportional estimate; only used to decide whether to widen
    return text.length * config.captionFontSize * (weight === 'bold' ? 0.65 : 0.6);
}

/**
 * Grows `svg` to fit a centred caption and adds it. Mutates in place and
 * returns the new outer size, or null if there is nothing to draw.
 */
export function applyCaption(svg: SVGElement, config: QrConfig): CaptionLayout | null {
    const text = config.captionText.trim();
    const width = Number(svg.getAttribute('width'));
    const height = Number(svg.getAttribute('height'));
    if (!text || !width || !height) return null;

    const doc = svg.ownerDocument;
    const fontSize = config.captionFontSize;
    const above = config.captionPosition === 'above';
    // gap to the QR, the line itself, and room for descenders
    const band = config.captionOffset + fontSize * 1.3;
    // widen rather than clip: a long caption should not be cut off
    const outerWidth = Math.max(width, Math.ceil(measureText(text, config) + fontSize));
    const outerHeight = Math.ceil(height + band);
    const dx = (outerWidth - width) / 2;
    const dy = above ? band : 0;

    // everything the library drew moves into a group so the QR can be offset
    const group = doc.createElementNS(SVG_NS, 'g');
    group.setAttribute('transform', `translate(${dx}, ${dy})`);
    while (svg.firstChild) group.appendChild(svg.firstChild);

    // the QR's own background only covers the QR, so the band needs its own
    const background = doc.createElementNS(SVG_NS, 'rect');
    background.setAttribute('x', '0');
    background.setAttribute('y', '0');
    background.setAttribute('width', String(outerWidth));
    background.setAttribute('height', String(outerHeight));
    background.setAttribute('fill', config.background);
    svg.appendChild(background);
    svg.appendChild(group);

    const label = doc.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', String(outerWidth / 2));
    label.setAttribute('y', String(above
        ? band - config.captionOffset - fontSize * 0.3
        : height + config.captionOffset + fontSize));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-family', config.captionFontFamily);
    label.setAttribute('font-size', String(fontSize));
    const { weight, style } = fontStyle(config.captionFontStyle);
    label.setAttribute('font-weight', weight);
    label.setAttribute('font-style', style);
    label.setAttribute('fill', config.captionColor);
    label.textContent = text;
    svg.appendChild(label);

    svg.setAttribute('width', String(outerWidth));
    svg.setAttribute('height', String(outerHeight));
    svg.setAttribute('viewBox', `0 0 ${outerWidth} ${outerHeight}`);
    return { width: outerWidth, height: outerHeight };
}

/** Outer size of a serialised svg, for sizing the PNG canvas. */
export function svgSize(svgText: string): CaptionLayout | null {
    const width = /<svg[^>]*\swidth="([\d.]+)"/.exec(svgText);
    const height = /<svg[^>]*\sheight="([\d.]+)"/.exec(svgText);
    if (!width || !height) return null;
    return { width: Number(width[1]), height: Number(height[1]) };
}
