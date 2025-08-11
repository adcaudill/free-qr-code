import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { LogoUploader } from './LogoUploader';
import { defaultConfig } from '../types';

// Mock FileReader & Image to control loading
class FRMock {
    onload: null | (() => void) = null;
    result: string | ArrayBuffer | null = null;
    readAsDataURL(_file: File) {
        this.result = testImageDataUrl;
        setTimeout(() => this.onload && this.onload(), 0);
    }
}
// @ts-expect-error override global
global.FileReader = FRMock as unknown as typeof FileReader;

// 10x10 red png
const testImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIElEQVQoU2NkYGD4z0AEYBxVSFUBCzAY1AEj0cQgGg0GABn6Axf+qPuEAAAAAElFTkSuQmCC';

// Mock Image to instantly load and have fixed dimensions 10x10
// @ts-expect-error override global
global.Image = class {
    onload: null | (() => void) = null;
    width = 10;
    height = 10;
    _src = '';
    set src(v: string) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); }
    get src() { return this._src; }
} as unknown as typeof Image;

// Utility to create a fake File
function makeFile(name = 'logo.png') {
    return new File([new Uint8Array([1, 2, 3])], name, { type: 'image/png' });
}

// Mock canvas 2d context
// Provide a very lightweight 2d context mock sufficient for our usage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
HTMLCanvasElement.prototype.getContext = function getContext(this: HTMLCanvasElement, contextId: string): any {
    if (contextId === '2d') {
        return {
            canvas: this,
            drawImage: () => { },
        };
    }
    return null;
};
HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,MOCKDATA';

describe('LogoUploader crop interactions', () => {
    it('opens dialog, allows resize (slider value changes), and applies crop producing data url', async () => {
        const handleChange = vi.fn();
        render(<LogoUploader config={{ ...defaultConfig }} onChange={handleChange} />);

        // Click drop zone to trigger file input (simulate change directly)
        const input: HTMLInputElement = document.querySelector('input[type="file"]')!;
        await act(async () => {
            fireEvent.change(input, { target: { files: [makeFile()] } });
            await new Promise(r => setTimeout(r, 20));
        });

        // Dialog should be open
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        // Container is the element with onMouseDown handlers (parent of img)
        const img = screen.getByAltText('To crop');
        const container = img.parentElement as HTMLElement; // containerRef target

        // Capture initial slider value (selection size)
        const slider = screen.getByRole('slider');
        const initialVal = Number(slider.getAttribute('aria-valuenow')) || 0;

        // Initial mousedown inside selection (center) then move by 2px
        await act(async () => {
            fireEvent.mouseDown(container, { clientX: 5, clientY: 5 });
            fireEvent.mouseMove(container, { clientX: 7, clientY: 8 });
            fireEvent.mouseUp(container);
        });

        // Resize: drag near bottom-right (approx selection full 10 so handle at ~10,10)
        await act(async () => {
            fireEvent.mouseDown(container, { clientX: 9, clientY: 9 });
            fireEvent.mouseMove(container, { clientX: 7, clientY: 7 }); // shrink
            fireEvent.mouseUp(container);
        });

        const resizedVal = Number(slider.getAttribute('aria-valuenow')) || 0;
        expect(resizedVal).toBeLessThanOrEqual(initialVal);
        expect(resizedVal).toBeGreaterThan(0);

        // Apply crop
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /apply/i }));
            await new Promise(r => setTimeout(r, 10));
        });

        // Change handler should receive a data url
        expect(handleChange).toHaveBeenCalled();
        const last = handleChange.mock.calls.pop()[0];
        expect(last.logoCroppedDataUrl).toMatch(/^data:image\/png;base64,/);
    });
});
