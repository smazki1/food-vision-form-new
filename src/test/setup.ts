/// <reference types="vitest/globals" />

import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// This file can be used for global test setup
// For example, mocking global objects or libraries

// import { vi } from 'vitest';
 
// Example: Mocking a global function
// global.myGlobalFunction = vi.fn(); 

// Mock ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// JSDOM doesn't implement PointerEvents fully, which Radix UI uses.
// Mocking these methods on Element.prototype can prevent errors.
if (typeof window !== 'undefined' && typeof window.Element !== 'undefined') {
  if (!window.Element.prototype.hasPointerCapture) {
    window.Element.prototype.hasPointerCapture = vi.fn();
  }
  if (!window.Element.prototype.setPointerCapture) {
    window.Element.prototype.setPointerCapture = vi.fn();
  }
  if (!window.Element.prototype.releasePointerCapture) {
    window.Element.prototype.releasePointerCapture = vi.fn();
  }
  // Mock scrollIntoView as it's not fully supported in JSDOM and Radix UI might use it
  if (!window.Element.prototype.scrollIntoView) {
    window.Element.prototype.scrollIntoView = vi.fn();
  }
}

// Cleans up the DOM after each test, ensuring a clean slate.
afterEach(() => {
  cleanup();
}); 