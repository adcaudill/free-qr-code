import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { LogoUploader } from './LogoUploader';
import { defaultConfig } from '../types';

class FRMock { onload: null | (() => void) = null; result: string | ArrayBuffer | null = null; readAsDataURL(_f: File) { this.result = testImage; setTimeout(() => this.onload && this.onload(), 0); } }
global.FileReader = FRMock as unknown as typeof FileReader;
const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIElEQVQoU2NkYGD4z0AEYBxVSFUBCzAY1AEj0cQgGg0GABn6Axf+qPuEAAAAAElFTkSuQmCC';
global.Image = class { onload: null | (() => void) = null; width = 10; height = 10; _src = ''; set src(v: string) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); } get src() { return this._src; } } as unknown as typeof Image;
HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, id: string) { if (id === '2d') return { canvas: this, drawImage: () => { } } as any; return null; } as any;
HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,MOCK';
function makeFile() { return new File([new Uint8Array([1, 2, 3])], 'logo.png', { type: 'image/png' }); }

describe('LogoUploader keyboard accessibility', () => {
    it('exposes focusable crop region with keyboard instructions', async () => {
        const onChange = vi.fn();
        render(<LogoUploader config={{ ...defaultConfig }} onChange={onChange} />);
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        await act(async () => { fireEvent.change(input, { target: { files: [makeFile()] } }); await new Promise(r => setTimeout(r, 25)); });
        const group = screen.getByRole('group', { name: /crop selection/i });
        expect(group.tabIndex).toBe(0);
        expect(group).toHaveAttribute('aria-label');
        expect(group).toHaveAttribute('aria-describedby');
        await act(async () => { fireEvent.keyDown(group, { key: 'ArrowRight' }); await new Promise(r => setTimeout(r, 0)); });
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: /apply/i })); await new Promise(r => setTimeout(r, 5)); });
        expect(onChange).toHaveBeenCalled();
    });
});
