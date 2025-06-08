import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock crypto.getRandomValues for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },    subtle: {
      importKey: jest.fn().mockImplementation((format, keyData, algorithm, extractable, keyUsages) => {
        // Store the key data for use in deriveBits
        return Promise.resolve({ keyData });
      }),      deriveBits: jest.fn().mockImplementation((algorithm, keyMaterial, length) => {
        // Mock implementation that returns different data based on all inputs
        const mockData = new Uint8Array(length / 8);
        
        // Create a hash from key material, salt, iterations, and length for deterministic but varied output
        const keySum = keyMaterial.keyData ? Array.from(keyMaterial.keyData).reduce((a, b) => a + b, 0) : 0;
        const saltSum = algorithm.salt ? Array.from(algorithm.salt).reduce((a, b) => a + b, 0) : 0;
        const iterHash = algorithm.iterations || 1000;
        const lengthHash = length; // Include length in the hash
        
        for (let i = 0; i < mockData.length; i++) {
          // Generate pseudo-random but deterministic data based on all inputs including length
          mockData[i] = (i + keySum + saltSum + iterHash + lengthHash) % 256;
        }
        return Promise.resolve(mockData.buffer);
      }),
    },
  },
});

// Mock window object for JSDOM
Object.defineProperty(global, 'window', {
  value: {
    crypto: global.crypto,
  },
  writable: true,
});

// Mock window.crypto for browser compatibility  
Object.defineProperty(window, 'crypto', {
  value: global.crypto,
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
  configurable: true,
});

// Mock document properties that user-event needs
Object.defineProperty(document, 'activeElement', {
  value: document.body,
  writable: true,
});

// Mock window.getSelection
Object.defineProperty(window, 'getSelection', {
  value: jest.fn(() => ({
    removeAllRanges: jest.fn(),
    addRange: jest.fn(),
  })),
});

// Mock Range constructor if it doesn't exist
global.Range = class Range {
  constructor() {
    this.startContainer = document.body;
    this.endContainer = document.body;
    this.startOffset = 0;
    this.endOffset = 0;
  }
  
  selectNodeContents() {}
  setStart() {}
  setEnd() {}
  cloneContents() {
    return document.createDocumentFragment();
  }
};
