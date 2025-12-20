import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CombinedDecoder } from '../src/decoder';

// Polyfill ImageData for Node.js
if (typeof globalThis.ImageData === 'undefined') {
  (globalThis as unknown as { ImageData: typeof ImageData }).ImageData = class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    colorSpace: PredefinedColorSpace = 'srgb';

    constructor(data: Uint8ClampedArray | number, widthOrHeight?: number, height?: number) {
      if (typeof data === 'number') {
        this.width = data;
        this.height = widthOrHeight!;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      } else {
        this.data = data;
        this.width = widthOrHeight!;
        this.height = height ?? (data.length / 4 / widthOrHeight!);
      }
    }
  } as unknown as typeof ImageData;
}

// Helper to load PNG image as ImageData (simplified - only works with raw RGBA)
async function loadTestImage(filename: string): Promise<ImageData | null> {
  try {
    const imagePath = join(__dirname, '../demo/public/test-barcodes', filename);
    const buffer = readFileSync(imagePath);

    // For PNG files, we need to decode them
    // This is a simplified check - in real tests you'd use sharp or canvas
    if (filename.endsWith('.png')) {
      // PNG magic bytes check
      if (buffer[0] === 0x89 && buffer[1] === 0x50) {
        // Would need PNG decoder here - skip for now
        return null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

describe('Integration Tests', () => {
  describe('Test image files exist', () => {
    it('should have QR code test image', () => {
      const imagePath = join(__dirname, '../demo/public/test-barcodes/qrcode.png');
      const exists = (() => {
        try {
          readFileSync(imagePath);
          return true;
        } catch {
          return false;
        }
      })();
      expect(exists).toBe(true);
    });

    it('should have DataMatrix test image', () => {
      const imagePath = join(__dirname, '../demo/public/test-barcodes/datamatrix.gif');
      const exists = (() => {
        try {
          readFileSync(imagePath);
          return true;
        } catch {
          return false;
        }
      })();
      expect(exists).toBe(true);
    });

    it('should have DataMatrix JPG test image', () => {
      const imagePath = join(__dirname, '../demo/public/test-barcodes/Data-Matrix-Code_allein.jpg');
      const exists = (() => {
        try {
          readFileSync(imagePath);
          return true;
        } catch {
          return false;
        }
      })();
      expect(exists).toBe(true);
    });
  });

  describe('CombinedDecoder', () => {
    it('should instantiate decoder', () => {
      const decoder = new CombinedDecoder();
      expect(decoder).toBeDefined();
      expect(decoder.isReady()).toBe(false);
    });

    it('should report supported formats', () => {
      const decoder = new CombinedDecoder();
      const formats = decoder.getSupportedFormats();
      expect(formats).toContain('DataMatrix');
      expect(formats).toContain('QRCode');
    });
  });

  // Note: Full WASM integration tests would require:
  // 1. A way to load WASM in Node.js (e.g., via fetch polyfill)
  // 2. Image decoding library (sharp, canvas, or jimp)
  // 3. More complex test setup
  //
  // For browser-based integration tests, consider using Playwright or Cypress
  // which can run tests in a real browser environment with full WASM support.
});
