// ============================================
// PRESCRIPTION SCANNER v1.1
// Lightweight barcode scanner for DataMatrix and QR Code
// PDF support, multi-code detection, headless mode!
// ============================================

// ===================
// MAIN API
// ===================
export { PrescriptionScanner, openScanner } from './modal';
export type { ScannerOptions, PreloadStrategy } from './modal';

// Simple functions
export { scan, scanAll, scanVideo, startScanner, cleanup } from './simple';

// Types
export type {
  BarcodeFormat,
  ScanResult,
  ScannerEvents,
  PreprocessingOptions,
  CameraOptions,
  Point,
  GrayscaleImage,
} from './types';

// Preprocessing utilities
export {
  preprocess,
  toGrayscale,
  toImageData,
  binarizeOtsu,
  adaptiveThreshold,
  otsuThreshold,
  binarize,
  invert,
  sharpen,
  sharpenLight,
  gaussianBlur,
  boxBlur,
  medianFilter,
  stretchContrast,
  grayscaleToRGBA,
  // Image enhancement
  upscaleImage,
  adjustBrightnessContrast,
  sharpenRGBA,
  enhanceForScanning,
} from './preprocessing';
export type { EnhanceOptions } from './preprocessing';

// Camera utilities
export {
  startCamera,
  stopCamera,
  grabFrame,
  isCameraSupported,
  getAvailableCameras,
  type CameraStream,
} from './camera';

// Decoder access
export { CombinedDecoder, ScannerWasmDecoder } from './decoder';
export type { BarcodeDecoder, DecodedBarcode } from './decoder';

// PDF utilities
export { processPDF, isPDF, isPdfJsLoaded } from './pdf';
export type { PDFPage, PDFProcessOptions } from './pdf';

// WASM files need to be copied to your public folder:
// - scanner.js (~53 KB)
// - scanner.wasm (~442 KB)
