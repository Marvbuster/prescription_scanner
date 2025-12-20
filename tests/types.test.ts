import { describe, it, expect } from 'vitest';
import type {
  BarcodeFormat,
  ScanResult,
  ScannerOptions,
  PreprocessingOptions,
  CameraOptions,
  Point,
  GrayscaleImage,
} from '../src/types';

describe('Type exports', () => {
  it('should export BarcodeFormat type', () => {
    const format: BarcodeFormat = 'DataMatrix';
    expect(['DataMatrix', 'QRCode']).toContain(format);
  });

  it('should export ScanResult type', () => {
    const result: ScanResult = {
      data: 'test',
      format: 'QRCode',
      timestamp: Date.now(),
      points: [{ x: 0, y: 0 }],
    };
    expect(result.data).toBe('test');
    expect(result.format).toBe('QRCode');
  });

  it('should export Point type', () => {
    const point: Point = { x: 10, y: 20 };
    expect(point.x).toBe(10);
    expect(point.y).toBe(20);
  });

  it('should export GrayscaleImage type', () => {
    const image: GrayscaleImage = {
      data: new Uint8Array([0, 128, 255]),
      width: 3,
      height: 1,
    };
    expect(image.data.length).toBe(3);
  });

  it('should export PreprocessingOptions type', () => {
    const options: PreprocessingOptions = {
      binarize: 'otsu',
      sharpen: true,
      denoise: false,
      invert: false,
    };
    expect(options.binarize).toBe('otsu');
  });

  it('should export CameraOptions type', () => {
    const options: CameraOptions = {
      facingMode: 'environment',
      resolution: { width: 1280, height: 720 },
      scanRate: 10,
    };
    expect(options.facingMode).toBe('environment');
  });
});
