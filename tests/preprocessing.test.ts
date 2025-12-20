import { describe, it, expect, beforeAll } from 'vitest';
import {
  toGrayscale,
  grayscaleToRGBA,
  invert,
  otsuThreshold,
} from '../src/preprocessing';
import type { GrayscaleImage } from '../src/types';

// Polyfill ImageData for jsdom
beforeAll(() => {
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
});

describe('Preprocessing utilities', () => {
  // Helper to create test ImageData
  const createImageData = (width: number, height: number, fillValue = 128): ImageData => {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = fillValue;     // R
      data[i + 1] = fillValue; // G
      data[i + 2] = fillValue; // B
      data[i + 3] = 255;       // A
    }
    return new ImageData(data, width, height);
  };

  // Helper to create test GrayscaleImage
  const createGrayscale = (width: number, height: number, fillValue = 128): GrayscaleImage => ({
    data: new Uint8Array(width * height).fill(fillValue),
    width,
    height,
  });

  describe('toGrayscale', () => {
    it('should convert RGBA to grayscale', () => {
      const imageData = createImageData(2, 2, 100);
      const result = toGrayscale(imageData);

      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
      expect(result.data.length).toBe(4);
      expect(result.data[0]).toBeCloseTo(100, 0);
    });

    it('should handle different RGB values', () => {
      const imageData = new ImageData(new Uint8ClampedArray([
        255, 0, 0, 255,   // Red
        0, 255, 0, 255,   // Green
        0, 0, 255, 255,   // Blue
        255, 255, 255, 255, // White
      ]), 2, 2);

      const result = toGrayscale(imageData);
      expect(result.data.length).toBe(4);
      // Red should be darker than green (human eye is more sensitive to green)
      expect(result.data[1]).toBeGreaterThan(result.data[0]);
    });
  });

  describe('grayscaleToRGBA', () => {
    it('should convert grayscale back to RGBA Uint8ClampedArray', () => {
      const gray = createGrayscale(2, 2, 128);
      const result = grayscaleToRGBA(gray);

      expect(result).toBeInstanceOf(Uint8ClampedArray);
      expect(result.length).toBe(16); // 2*2*4
      expect(result[0]).toBe(128); // R
      expect(result[1]).toBe(128); // G
      expect(result[2]).toBe(128); // B
      expect(result[3]).toBe(255); // A
    });
  });

  describe('invert', () => {
    it('should invert grayscale values', () => {
      const gray = createGrayscale(2, 2, 100);
      const result = invert(gray);

      expect(result.data[0]).toBe(155); // 255 - 100
    });

    it('should invert black to white', () => {
      const gray = createGrayscale(1, 1, 0);
      const result = invert(gray);
      expect(result.data[0]).toBe(255);
    });

    it('should invert white to black', () => {
      const gray = createGrayscale(1, 1, 255);
      const result = invert(gray);
      expect(result.data[0]).toBe(0);
    });
  });

  describe('otsuThreshold', () => {
    it('should calculate threshold for uniform image', () => {
      const gray = createGrayscale(10, 10, 128);
      const threshold = otsuThreshold(gray);
      expect(threshold).toBeGreaterThanOrEqual(0);
      expect(threshold).toBeLessThanOrEqual(255);
    });

    it('should find threshold for bimodal image', () => {
      // Create image with half dark, half bright
      const data = new Uint8Array(100);
      for (let i = 0; i < 50; i++) data[i] = 30;
      for (let i = 50; i < 100; i++) data[i] = 220;

      const gray: GrayscaleImage = { data, width: 10, height: 10 };
      const threshold = otsuThreshold(gray);

      // Threshold should be somewhere in the range
      expect(threshold).toBeGreaterThanOrEqual(30);
      expect(threshold).toBeLessThanOrEqual(220);
    });
  });
});
