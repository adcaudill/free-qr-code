// Recolour a logo, keeping its shape.
//
// Every visible pixel is replaced with a single colour and the alpha channel is
// left alone, so a white glyph on transparency comes back as the same glyph in
// the chosen colour. A multi-coloured logo comes back as a flat silhouette -
// that is what a colour overlay is.
//
// A logo with an opaque background has no transparency to preserve, so the whole
// square takes the colour. Nothing to do about that here; it is the file, not
// the operation.

// The tint runs on every preview update and every export, and the input rarely
// changes, so the last result is kept.
let cache: { source: string; color: string; result: string } | null = null;

export function tintLogo(dataUrl: string, color: string): Promise<string> {
    if (cache && cache.source === dataUrl && cache.color === color) {
        return Promise.resolve(cache.result);
    }
    return new Promise(resolve => {
        // Any failure falls back to the untinted logo: a logo in the wrong
        // colour beats no logo at all.
        const done = (result: string) => {
            if (result !== dataUrl) cache = { source: dataUrl, color, result };
            resolve(result);
        };
        const img = new Image();
        img.onerror = () => done(dataUrl);
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width || 1;
                canvas.height = img.height || 1;
                const ctx = canvas.getContext('2d');
                if (!ctx) { done(dataUrl); return; }
                ctx.drawImage(img, 0, 0);
                // source-in paints the fill only where the logo is already
                // opaque, which keeps the alpha mask and discards the colours
                ctx.globalCompositeOperation = 'source-in';
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                done(canvas.toDataURL('image/png'));
            } catch {
                done(dataUrl);
            }
        };
        img.src = dataUrl;
    });
}
