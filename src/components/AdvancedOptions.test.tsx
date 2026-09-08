import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AdvancedOptions } from './AdvancedOptions';
import { defaultConfig, QrConfig } from '../types';

function setup(overrides: Partial<QrConfig> = {}) {
    const onChange = vi.fn();
    render(<AdvancedOptions config={{ ...defaultConfig, ...overrides }} onChange={onChange} />);
    return { onChange };
}

describe('AdvancedOptions number fields', () => {
    it('leaves a half-typed size alone until the field is committed', () => {
        const { onChange } = setup({ size: 1024 });
        const size = screen.getByLabelText('Size (px)') as HTMLInputElement;

        // deleting digits used to snap the value back to the minimum mid-edit
        fireEvent.change(size, { target: { value: '102' } });
        fireEvent.change(size, { target: { value: '10' } });
        expect(size.value).toBe('10');
        expect(onChange).not.toHaveBeenCalled();

        fireEvent.change(size, { target: { value: '2048' } });
        fireEvent.blur(size);
        expect(onChange).toHaveBeenCalledWith({ size: 2048 });
    });

    it('clamps to the minimum only on commit', () => {
        const { onChange } = setup({ size: 1024 });
        const size = screen.getByLabelText('Size (px)') as HTMLInputElement;
        fireEvent.change(size, { target: { value: '10' } });
        fireEvent.blur(size);
        expect(onChange).toHaveBeenCalledWith({ size: 128 });
        expect(size.value).toBe('128');
    });

    it('commits on Enter', () => {
        const { onChange } = setup({ size: 256 });
        const size = screen.getByLabelText('Size (px)') as HTMLInputElement;
        fireEvent.change(size, { target: { value: '512' } });
        fireEvent.keyDown(size, { key: 'Enter' });
        expect(onChange).toHaveBeenCalledWith({ size: 512 });
    });

    it('restores the previous value when the field is left empty', () => {
        const { onChange } = setup({ size: 256 });
        const size = screen.getByLabelText('Size (px)') as HTMLInputElement;
        fireEvent.change(size, { target: { value: '' } });
        fireEvent.blur(size);
        expect(onChange).not.toHaveBeenCalled();
        expect(size.value).toBe('256');
    });

    it('names the error correction levels in words', () => {
        setup({ errorCorrection: 'Q' });
        expect(screen.getByText('High (25%)')).toBeInTheDocument();
    });
});
