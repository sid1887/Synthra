/**
 * Test Setup File for Vitest
 */
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
// Cleanup after each test
afterEach(() => {
    cleanup();
});
// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    takeRecords() {
        return [];
    }
    unobserve() { }
};
// Mock WebSocket (will be overridden in tests if needed)
global.WebSocket = class WebSocket {
    constructor(url) {
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: url
        });
    }
    send() { }
    close() { }
    addEventListener() { }
    removeEventListener() { }
};
// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
    console.error = vi.fn((...args) => {
        if (typeof args[0] === 'string' &&
            args[0].includes('Warning: ReactDOM.render')) {
            return;
        }
        originalError.call(console, ...args);
    });
});
afterAll(() => {
    console.error = originalError;
});
