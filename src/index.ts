// ============================================
// PRESCRIPTION SCANNER v1.1
// Lightweight barcode scanner for DataMatrix and QR Code
// Now with PDF support and multi-code detection!
// ============================================

// ===================
// SIMPLE API (recommended)
// ===================
export { PrescriptionScanner, openScanner } from './modal';
export type { ScannerModalOptions } from './modal';

// Simple functions
export { scan, scanAll, scanVideo, startScanner, cleanup } from './simple';

// ===================
// ADVANCED API
// ===================
export { SuperScanner } from './scanner';

// Types
export type {
  BarcodeFormat,
  ScanResult,
  ScannerOptions,
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
} from './preprocessing';

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
export { CombinedDecoder, ZBarDecoder, DataMatrixDecoder } from './decoder';
export type { BarcodeDecoder, DecodedBarcode } from './decoder';

// PDF utilities
export { processPDF, isPDF, isPdfJsLoaded } from './pdf';
export type { PDFPage, PDFProcessOptions } from './pdf';

// WASM files need to be copied to your public folder:
// - scanner.js (~53 KB)
// - scanner.wasm (~442 KB)
