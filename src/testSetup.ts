import '@testing-library/jest-dom';

// Polyfill matchMedia for components using it (e.g., prefers-color-scheme detection)
if (typeof window !== 'undefined' && !window.matchMedia) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.matchMedia = (query: string): any => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { /* deprecated */ },
        removeListener: () => { /* deprecated */ },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false
    });
}
