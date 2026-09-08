import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { LogoUploader } from './LogoUploader';
import { defaultConfig } from '../types';

// A deliberately non-square image: the cropper used to force a square selection,
// so the interesting cases all involve width and height differing.
const IMAGE_W = 40;
const IMAGE_H = 20;
const testImage = 'data:image/png;base64,AAAA';

class FRMock {
    onload: null | (() => void) = null;
    result: string | ArrayBuffer | null = null;
    readAsDataURL(_f: File) { this.result = testImage; setTimeout(() => this.onload && this.onload(), 0); }
}
global.FileReader = FRMock as unknown as typeof FileReader;

global.Image = class {
    onload: null | (() => void) = null;
    width = IMAGE_W;
    height = IMAGE_H;
    _src = '';
    set src(v: string) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); }
    get src() { return this._src; }
} as unknown as typeof Image;

interface Drawn { calls: string[]; width: number; height: number }
let drawn: Drawn;

beforeEach(() => {
    drawn = { calls: [], width: 0, height: 0 };
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, id: string) {
        if (id !== '2d') return null;
        return {
            canvas: this,
            beginPath: () => { drawn.calls.push('beginPath'); },
            ellipse: () => { drawn.calls.push('ellipse'); },
            clip: () => { drawn.calls.push('clip'); },
            drawImage: () => { drawn.calls.push('drawImage'); }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    HTMLCanvasElement.prototype.toDataURL = function (this: HTMLCanvasElement) {
        drawn.width = this.width;
        drawn.height = this.height;
        return 'data:image/png;base64,CROPPED';
    };
});

function makeFile() { return new File([new Uint8Array([1, 2, 3])], 'logo.png', { type: 'image/png' }); }

async function openCropper() {
    const onChange = vi.fn();
    render(<LogoUploader config={{ ...defaultConfig }} onChange={onChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
        fireEvent.change(input, { target: { files: [makeFile()] } });
        await new Promise(r => setTimeout(r, 25));
    });
    return { onChange, area: screen.getByRole('group', { name: /crop selection/i }) };
}

const crop = (area: HTMLElement) => ({
    x: Number(area.dataset.cropX),
    y: Number(area.dataset.cropY),
    w: Number(area.dataset.cropW),
    h: Number(area.dataset.cropH),
    shape: area.dataset.cropShape
});

async function pick(label: string) {
    await act(async () => { fireEvent.click(screen.getByRole('radio', { name: label })); });
}

async function press(area: HTMLElement, key: string, shiftKey = false) {
    await act(async () => { fireEvent.keyDown(area, { key, shiftKey }); });
}

async function apply() {
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /apply/i }));
        await new Promise(r => setTimeout(r, 5));
    });
}

describe('LogoUploader crop shapes', () => {
    it('starts on a centred square selection', async () => {
        const { area } = await openCropper();
        expect(crop(area)).toEqual({ x: 10, y: 0, w: 20, h: 20, shape: 'square' });
    });

    it('offers every shape', async () => {
        await openCropper();
        for (const label of ['Square', 'Round', 'User defined', 'All']) {
            expect(screen.getByRole('radio', { name: label })).toBeInTheDocument();
        }
    });

    it('takes the whole image, rectangle and all, for All', async () => {
        const { area, onChange } = await openCropper();
        await pick('All');
        expect(crop(area)).toEqual({ x: 0, y: 0, w: IMAGE_W, h: IMAGE_H, shape: 'all' });

        await apply();
        expect(drawn.width).toBe(IMAGE_W);
        expect(drawn.height).toBe(IMAGE_H);
        expect(onChange.mock.calls.pop()![0].logoCroppedDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it('resizes width and height independently when user defined', async () => {
        const { area } = await openCropper();
        await pick('User defined');
        await press(area, 'ArrowRight', true);
        expect(crop(area)).toMatchObject({ w: 21, h: 20 });
        // the selection already spans the full height, so only width could grow;
        // shrinking proves the two move independently
        await press(area, 'ArrowUp', true);
        expect(crop(area)).toMatchObject({ w: 21, h: 19 });
    });

    it('keeps width and height together for square', async () => {
        const { area } = await openCropper();
        await press(area, 'ArrowLeft', true);
        expect(crop(area)).toMatchObject({ w: 19, h: 19 });
    });

    it('squares the selection back up when leaving user defined', async () => {
        const { area } = await openCropper();
        await pick('User defined');
        await press(area, 'ArrowRight', true);
        await press(area, 'ArrowRight', true);
        expect(crop(area)).toMatchObject({ w: 22, h: 20 });

        await pick('Round');
        const squared = crop(area);
        expect(squared.w).toBe(squared.h);
        expect(squared.w).toBe(20);
    });

    it('clips to a circle for round', async () => {
        await openCropper();
        await pick('Round');
        await apply();
        expect(drawn.calls).toEqual(['beginPath', 'ellipse', 'clip', 'drawImage']);
    });

    it('does not clip for the rectangular shapes', async () => {
        await openCropper();
        await apply();
        expect(drawn.calls).toEqual(['drawImage']);
    });

    it('never lets the selection leave the image', async () => {
        const { area } = await openCropper();
        await pick('User defined');
        for (let i = 0; i < 60; i++) await press(area, 'ArrowRight', true);
        const { x, w } = crop(area);
        expect(x + w).toBeLessThanOrEqual(IMAGE_W);

        for (let i = 0; i < 60; i++) await press(area, 'ArrowRight');
        const moved = crop(area);
        expect(moved.x + moved.w).toBeLessThanOrEqual(IMAGE_W);
        expect(moved.y + moved.h).toBeLessThanOrEqual(IMAGE_H);
    });
});
