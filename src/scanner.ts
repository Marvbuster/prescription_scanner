import type {
  BarcodeFormat,
  ScanResult,
  ScannerOptions,
  ScannerEvents,
  PreprocessingOptions,
  CameraOptions,
  ScanBounds,
} from './types';
// Preprocessing not needed - WASM handles RGBA directly
import { CombinedDecoder } from './decoder';
import {
  startCamera,
  stopCamera,
  grabFrame,
  isCameraSupported,
  type CameraStream,
} from './camera';

/**
 * Main scanner class - the primary interface for barcode scanning
 */
export class SuperScanner {
  private options: Required<Omit<ScannerOptions, 'scanBounds' | 'wasmBasePath'>>;
  private decoder: CombinedDecoder;
  private camera: CameraStream | null = null;
  private scanning = false;
  private animationFrame: number | null = null;
  private lastScanTime = 0;
  private scanBounds: ScanBounds | null = null;

  private scanHandlers = new Set<(result: ScanResult) => void>();
  private errorHandlers = new Set<(error: Error) => void>();
  private startHandlers = new Set<() => void>();
  private stopHandlers = new Set<() => void>();

  // Default options
  private static defaultOptions: Required<Omit<ScannerOptions, 'scanBounds' | 'wasmBasePath'>> = {
    formats: ['QRCode', 'DataMatrix'],
    preprocessing: {
      binarize: 'none',
      sharpen: false,
      denoise: false,
      invert: false,
    },
    camera: {
      facingMode: 'environment',
      resolution: { width: 1280, height: 720 },
      scanRate: 10, // scans per second
    },
  };

  constructor(options: ScannerOptions = {}) {
    this.options = {
      ...SuperScanner.defaultOptions,
      ...options,
      preprocessing: {
        ...SuperScanner.defaultOptions.preprocessing,
        ...options.preprocessing,
      },
      camera: {
        ...SuperScanner.defaultOptions.camera,
        ...options.camera,
      },
    };

    if (options.scanBounds) {
      this.scanBounds = options.scanBounds;
    }

    this.decoder = new CombinedDecoder(options.wasmBasePath);
  }

  /**
   * Initialize the scanner (load WASM modules)
   */
  async init(): Promise<void> {
    await this.decoder.init(this.options.formats);
  }

  /**
   * Set scan bounds
   */
  setScanBounds(bounds: ScanBounds | null): void {
    this.scanBounds = bounds;
  }

  /**
   * Get current scan bounds
   */
  getScanBounds(): ScanBounds | null {
    return this.scanBounds;
  }

  /**
   * Register event handler
   */
  on(event: 'scan', callback: (result: ScanResult) => void): void;
  on(event: 'error', callback: (error: Error) => void): void;
  on(event: 'start' | 'stop', callback: () => void): void;
  on(event: keyof ScannerEvents, callback: ((result: ScanResult) => void) | ((error: Error) => void) | (() => void)): void {
    switch (event) {
      case 'scan':
        this.scanHandlers.add(callback as (result: ScanResult) => void);
        break;
      case 'error':
        this.errorHandlers.add(callback as (error: Error) => void);
        break;
      case 'start':
        this.startHandlers.add(callback as () => void);
        break;
      case 'stop':
        this.stopHandlers.add(callback as () => void);
        break;
    }
  }

  /**
   * Remove event handler
   */
  off(event: 'scan', callback: (result: ScanResult) => void): void;
  off(event: 'error', callback: (error: Error) => void): void;
  off(event: 'start' | 'stop', callback: () => void): void;
  off(event: keyof ScannerEvents, callback: ((result: ScanResult) => void) | ((error: Error) => void) | (() => void)): void {
    switch (event) {
      case 'scan':
        this.scanHandlers.delete(callback as (result: ScanResult) => void);
        break;
      case 'error':
        this.errorHandlers.delete(callback as (error: Error) => void);
        break;
      case 'start':
        this.startHandlers.delete(callback as () => void);
        break;
      case 'stop':
        this.stopHandlers.delete(callback as () => void);
        break;
    }
  }

  /**
   * Emit event
   */
  private emit(event: 'scan', result: ScanResult): void;
  private emit(event: 'error', error: Error): void;
  private emit(event: 'start' | 'stop'): void;
  private emit(event: keyof ScannerEvents, arg?: ScanResult | Error): void {
    try {
      switch (event) {
        case 'scan':
          for (const handler of this.scanHandlers) handler(arg as ScanResult);
          break;
        case 'error':
          for (const handler of this.errorHandlers) handler(arg as Error);
          break;
        case 'start':
          for (const handler of this.startHandlers) handler();
          break;
        case 'stop':
          for (const handler of this.stopHandlers) handler();
          break;
      }
    } catch (e) {
      console.error(`Error in ${event} handler:`, e);
    }
  }

  /**
   * Start scanning from video element
   */
  async start(videoElement: HTMLVideoElement): Promise<void> {
    if (this.scanning) {
      return;
    }

    if (!isCameraSupported()) {
      throw new Error('Camera not supported in this browser');
    }

    // Initialize decoder if not already done
    if (!this.decoder.isReady()) {
      await this.init();
    }

    // Start camera
    this.camera = await startCamera(videoElement, this.options.camera);
    this.scanning = true;
    this.emit('start');

    // Start scan loop
    this.scanLoop();
  }

  /**
   * Stop scanning
   */
  stop(): void {
    if (!this.scanning) {
      return;
    }

    this.scanning = false;

    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.camera) {
      stopCamera(this.camera);
      this.camera = null;
    }

    this.emit('stop');
  }

  /**
   * Main scan loop
   */
  private scanLoop(): void {
    if (!this.scanning || !this.camera) {
      return;
    }

    const now = Date.now();
    const minInterval = 1000 / (this.options.camera.scanRate || 10);

    if (now - this.lastScanTime >= minInterval) {
      this.lastScanTime = now;

      // Grab and process frame
      const imageData = grabFrame(this.camera);
      this.processFrame(imageData).catch((error) => {
        this.emit('error', error);
      });
    }

    // Schedule next frame
    this.animationFrame = requestAnimationFrame(() => this.scanLoop());
  }

  /**
   * Process a single frame
   */
  private async processFrame(imageData: ImageData): Promise<void> {
    // Crop to scan bounds if set
    const dataToScan = this.scanBounds
      ? this.cropImageData(imageData, this.scanBounds)
      : imageData;

    // Decode directly - WASM handles RGBA
    const results = await this.decoder.decode(dataToScan, this.options.formats);

    // Adjust point coordinates back to full frame if cropped
    if (this.scanBounds && results.length > 0) {
      const offsetX = this.computeBoundsPx(imageData.width, imageData.height).x;
      const offsetY = this.computeBoundsPx(imageData.width, imageData.height).y;

      for (const result of results) {
        if (result.points) {
          result.points = result.points.map(p => ({
            x: p.x + offsetX,
            y: p.y + offsetY,
          }));
        }
      }
    }

    // Emit results
    for (const result of results) {
      this.emit('scan', result);
    }
  }

  /**
   * Crop ImageData to bounds
   */
  private cropImageData(imageData: ImageData, bounds: ScanBounds): ImageData {
    const { x, y, width, height } = this.computeBoundsPx(imageData.width, imageData.height);

    // Clamp to image boundaries
    const cropX = Math.max(0, Math.min(x, imageData.width));
    const cropY = Math.max(0, Math.min(y, imageData.height));
    const cropW = Math.min(width, imageData.width - cropX);
    const cropH = Math.min(height, imageData.height - cropY);

    if (cropW <= 0 || cropH <= 0) {
      return imageData; // Invalid bounds, return original
    }

    // Create new ImageData for cropped region
    const croppedData = new Uint8ClampedArray(cropW * cropH * 4);

    for (let row = 0; row < cropH; row++) {
      const srcStart = ((cropY + row) * imageData.width + cropX) * 4;
      const dstStart = row * cropW * 4;
      croppedData.set(
        imageData.data.subarray(srcStart, srcStart + cropW * 4),
        dstStart
      );
    }

    return new ImageData(croppedData, cropW, cropH);
  }

  /**
   * Compute bounds in pixels
   */
  private computeBoundsPx(frameWidth: number, frameHeight: number): { x: number; y: number; width: number; height: number } {
    if (!this.scanBounds) {
      return { x: 0, y: 0, width: frameWidth, height: frameHeight };
    }

    const b = this.scanBounds;
    const x = b.x <= 1 ? Math.round(b.x * frameWidth) : Math.round(b.x);
    const y = b.y <= 1 ? Math.round(b.y * frameHeight) : Math.round(b.y);
    const width = b.width <= 1 ? Math.round(b.width * frameWidth) : Math.round(b.width);
    const height = b.height <= 1 ? Math.round(b.height * frameHeight) : Math.round(b.height);

    return { x, y, width, height };
  }

  /**
   * Scan a single image
   */
  async scanImage(image: HTMLImageElement): Promise<ScanResult[]> {
    if (!this.decoder.isReady()) {
      await this.init();
    }

    // Create canvas to extract image data
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    return this.scanImageData(imageData);
  }

  /**
   * Scan ImageData directly
   */
  async scanImageData(imageData: ImageData): Promise<ScanResult[]> {
    if (!this.decoder.isReady()) {
      await this.init();
    }

    return this.decoder.decode(imageData, this.options.formats);
  }

  /**
   * Scan from canvas
   */
  async scanCanvas(canvas: HTMLCanvasElement): Promise<ScanResult[]> {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return this.scanImageData(imageData);
  }

  /**
   * Check if currently scanning
   */
  isScanning(): boolean {
    return this.scanning;
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): BarcodeFormat[] {
    return this.decoder.getSupportedFormats();
  }

  /**
   * Update options
   */
  setOptions(options: Partial<ScannerOptions>): void {
    if (options.preprocessing) {
      this.options.preprocessing = {
        ...this.options.preprocessing,
        ...options.preprocessing,
      };
    }
    if (options.camera) {
      this.options.camera = {
        ...this.options.camera,
        ...options.camera,
      };
    }
    if (options.formats) {
      this.options.formats = options.formats;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.decoder.destroy();
    this.scanHandlers.clear();
    this.errorHandlers.clear();
    this.startHandlers.clear();
    this.stopHandlers.clear();
  }
}
