import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { App } from './App';

// Basic smoke test to ensure App renders core elements without crashing

describe('App', () => {
    it('renders heading and URL field', () => {
        render(<App />);
        // App bar title
        expect(screen.getAllByText(/Free QR/i)[0]).toBeTruthy();
        // URL tab selected by default and input visible
        expect(screen.getByLabelText(/URL/i)).toBeInTheDocument();
    });
});
