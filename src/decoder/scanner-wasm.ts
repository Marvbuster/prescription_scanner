/**
 * Custom Scanner WASM - 495 KB for DataMatrix & QR Code
 */

import type { BarcodeFormat } from '../types';
import type { BarcodeDecoder, DecodedBarcode } from './types';

interface WasmResult {
  text: string;
  format: string;
  error: string;
  x0: number; y0: number;
  x1: number; y1: number;
  x2: number; y2: number;
  x3: number; y3: number;
}

interface EmbindVector<T> {
  size(): number;
  get(index: number): T;
}

interface ScannerModule {
  scan: (ptr: number, width: number, height: number) => EmbindVector<WasmResult>;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  HEAPU8: Uint8Array;
}

type CreateScannerFn = (options: { locateFile: (path: string) => string }) => Promise<ScannerModule>;

interface WindowWithScanner {
  createScanner?: CreateScannerFn;
}

const FORMAT_MAP: Record<string, BarcodeFormat> = {
  'DataMatrix': 'DataMatrix',
  'QRCode': 'QRCode',
};

export class ScannerWasmDecoder implements BarcodeDecoder {
  name = 'scanner-wasm';
  supportedFormats: BarcodeFormat[] = ['DataMatrix', 'QRCode'];

  private module: ScannerModule | null = null;
  private ready = false;
  private loading: Promise<void> | null = null;
  private wasmBasePath: string;

  constructor(wasmBasePath = '/wasm/') {
    // Normalize: ensure trailing slash
    this.wasmBasePath = wasmBasePath.endsWith('/') ? wasmBasePath : wasmBasePath + '/';
  }

  async init(): Promise<void> {
    if (this.ready) return;
    if (this.loading) return this.loading;
    this.loading = this.loadModule();
    await this.loading;
  }

  private async loadModule(): Promise<void> {
    await this.loadScript(this.wasmBasePath + 'scanner.js');
    const createScanner = (window as unknown as WindowWithScanner).createScanner;
    if (!createScanner) throw new Error('WASM loader not found');
    this.module = await createScanner({
      locateFile: (path: string) => path.endsWith('.wasm') ? this.wasmBasePath + 'scanner.wasm' : path
    });
    this.ready = true;
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as unknown as WindowWithScanner).createScanner) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  isReady(): boolean {
    return this.ready;
  }

  async decode(imageData: ImageData, formats: BarcodeFormat[]): Promise<DecodedBarcode[]> {
    if (!this.ready || !this.module) return [];

    try {
      const { data, width, height } = imageData;
      const ptr = this.module._malloc(data.length);
      this.module.HEAPU8.set(data, ptr);

      const resultVector = this.module.scan(ptr, width, height);
      this.module._free(ptr);

      const decoded: DecodedBarcode[] = [];
      const count = resultVector.size();

      for (let i = 0; i < count; i++) {
        const r = resultVector.get(i);
        const format = FORMAT_MAP[r.format];
        if (format && formats.includes(format)) {
          decoded.push({
            data: r.text,
            format,
            points: [
              { x: r.x0, y: r.y0 },
              { x: r.x1, y: r.y1 },
              { x: r.x2, y: r.y2 },
              { x: r.x3, y: r.y3 },
            ],
          });
        }
      }
      return decoded;
    } catch {
      return [];
    }
  }

  destroy(): void {
    this.module = null;
    this.ready = false;
    this.loading = null;
  }
}
