import type { BarcodeFormat, ScanResult } from '../types';
import type { BarcodeDecoder, DecodedBarcode } from './types';
import { ScannerWasmDecoder } from './scanner-wasm';

export type { BarcodeDecoder, DecodedBarcode } from './types';
export { ScannerWasmDecoder } from './scanner-wasm';

/**
 * Combined Decoder - uses zxing-cpp WASM
 * Supports: DataMatrix, QRCode
 * Size: ~495 KB
 */
export class CombinedDecoder {
  private decoder: ScannerWasmDecoder;
  private initialized = false;

  constructor(wasmBasePath?: string) {
    this.decoder = new ScannerWasmDecoder(wasmBasePath);
  }

  async init(formats: BarcodeFormat[]): Promise<void> {
    if (this.initialized) return;
    await this.decoder.init();
    this.initialized = true;
  }

  async decode(
    imageData: ImageData,
    formats: BarcodeFormat[]
  ): Promise<ScanResult[]> {
    if (!this.initialized) {
      throw new Error('Decoder not initialized');
    }

    const results = await this.decoder.decode(imageData, formats);

    const timestamp = Date.now();
    return results.map((r) => ({
      ...r,
      timestamp,
    }));
  }

  getSupportedFormats(): BarcodeFormat[] {
    return this.decoder.supportedFormats;
  }

  isReady(): boolean {
    return this.initialized && this.decoder.isReady();
  }

  destroy(): void {
    this.decoder.destroy();
    this.initialized = false;
  }
}
