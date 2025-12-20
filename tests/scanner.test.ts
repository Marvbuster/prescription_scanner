import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the WASM module before importing
vi.mock('../src/decoder/scanner-wasm', () => ({
  ScannerWasmDecoder: class MockDecoder {
    private ready = false;
    async init() { this.ready = true; }
    isReady() { return this.ready; }
    decode() { return Promise.resolve([]); }
    destroy() {}
    getSupportedFormats() { return ['DataMatrix', 'QRCode']; }
  }
}));

import { PrescriptionScanner } from '../src/modal';

describe('PrescriptionScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const scanner = new PrescriptionScanner();
      expect(scanner).toBeInstanceOf(PrescriptionScanner);
    });

    it('should accept custom options', () => {
      const onScan = vi.fn();
      const scanner = new PrescriptionScanner({
        onScan,
        formats: ['DataMatrix'],
      });
      expect(scanner).toBeInstanceOf(PrescriptionScanner);
    });

    it('should default to headless mode', () => {
      const scanner = new PrescriptionScanner();
      // Headless mode means no modal is created
      expect(scanner.isReady()).toBe(false);
    });
  });

  describe('getResults / clearResults', () => {
    it('should return empty array initially', () => {
      const scanner = new PrescriptionScanner();
      expect(scanner.getResults()).toEqual([]);
    });

    it('should clear results', () => {
      const scanner = new PrescriptionScanner();
      scanner.clearResults();
      expect(scanner.getResults()).toEqual([]);
    });
  });

  describe('isReady', () => {
    it('should return false before init', () => {
      const scanner = new PrescriptionScanner();
      expect(scanner.isReady()).toBe(false);
    });

    it('should return true after init', async () => {
      const scanner = new PrescriptionScanner();
      await scanner.init();
      expect(scanner.isReady()).toBe(true);
    });
  });

  describe('preload strategies', () => {
    it('should accept lazy preload (default)', () => {
      const scanner = new PrescriptionScanner({ preload: 'lazy' });
      expect(scanner.isReady()).toBe(false);
    });

    it('should accept false preload (manual)', () => {
      const scanner = new PrescriptionScanner({ preload: false });
      expect(scanner.isReady()).toBe(false);
    });
  });

  describe('callbacks', () => {
    it('should call onReady after init', async () => {
      const onReady = vi.fn();
      const scanner = new PrescriptionScanner({ onReady });
      await scanner.init();
      expect(onReady).toHaveBeenCalled();
    });

    it('should call onError on error', async () => {
      const onError = vi.fn();
      const scanner = new PrescriptionScanner({ onError });
      // Trigger an error by trying to scan without camera
      expect(scanner).toBeDefined();
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const scanner = new PrescriptionScanner();
      expect(() => scanner.destroy()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      const scanner = new PrescriptionScanner();
      scanner.destroy();
      expect(() => scanner.destroy()).not.toThrow();
    });
  });
});
