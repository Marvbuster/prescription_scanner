/**
 * Supported barcode formats
 */
export type BarcodeFormat = 'QRCode' | 'DataMatrix';

/**
 * Result of a successful barcode scan
 */
export interface ScanResult {
  /** The decoded data */
  data: string;
  /** The barcode format that was detected */
  format: BarcodeFormat;
  /** Corner points of the barcode in the image (if available) */
  points?: Point[];
  /** Raw bytes (if available) */
  rawBytes?: Uint8Array;
  /** Timestamp of the scan */
  timestamp: number;
}

/**
 * A point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Scan bounds - defines the area to scan within the video frame
 * Values can be absolute pixels or relative (0-1) to the frame size
 */
export interface ScanBounds {
  /** X offset from left (pixels or 0-1 relative) */
  x: number;
  /** Y offset from top (pixels or 0-1 relative) */
  y: number;
  /** Width of scan area (pixels or 0-1 relative) */
  width: number;
  /** Height of scan area (pixels or 0-1 relative) */
  height: number;
}

/**
 * Preprocessing options
 */
export interface PreprocessingOptions {
  /** Binarization method */
  binarize?: 'otsu' | 'adaptive' | 'none';
  /** Apply sharpening filter */
  sharpen?: boolean;
  /** Apply denoising */
  denoise?: boolean;
  /** Invert colors (for light codes on dark background) */
  invert?: boolean;
}

/**
 * Camera configuration
 */
export interface CameraOptions {
  /** Which camera to use */
  facingMode?: 'user' | 'environment';
  /** Preferred resolution */
  resolution?: {
    width: number;
    height: number;
  };
  /** Frames per second to scan */
  scanRate?: number;
}

/**
 * Scanner configuration
 */
export interface ScannerOptions {
  /** Which formats to scan for */
  formats?: BarcodeFormat[];
  /** Preprocessing configuration */
  preprocessing?: PreprocessingOptions;
  /** Camera configuration */
  camera?: CameraOptions;
  /** Scan bounds - area to scan within video frame */
  scanBounds?: ScanBounds;
}

/**
 * Scanner event types
 */
export interface ScannerEvents {
  scan: (result: ScanResult) => void;
  error: (error: Error) => void;
  start: () => void;
  stop: () => void;
}

/**
 * Internal image data for processing
 */
export interface GrayscaleImage {
  data: Uint8Array;
  width: number;
  height: number;
}
