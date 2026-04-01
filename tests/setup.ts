/**
 * UNY Test Setup
 * Configures global test environment for Vitest.
 */

import { vi } from 'vitest';

// Mock crypto.getRandomValues for Node.js test environment
if (!globalThis.crypto) {
  globalThis.crypto = {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  } as Crypto;
}
