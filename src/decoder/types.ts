import type { BarcodeFormat, Point, ScanResult } from '../types';

/**
 * Interface for barcode decoders
 */
export interface BarcodeDecoder {
  /** Name of this decoder */
  name: string;

  /** Formats supported by this decoder */
  supportedFormats: BarcodeFormat[];

  /** Initialize the decoder (load WASM, etc.) */
  init(): Promise<void>;

  /** Check if decoder is ready */
  isReady(): boolean;

  /**
   * Decode barcodes from ImageData
   * @param imageData Image data from canvas
   * @param formats Which formats to scan for
   * @returns Array of detected barcodes
   */
  decode(
    imageData: ImageData,
    formats: BarcodeFormat[]
  ): Promise<DecodedBarcode[]>;

  /** Clean up resources */
  destroy(): void;
}

/**
 * Raw decoded barcode data from a decoder
 */
export interface DecodedBarcode {
  data: string;
  format: BarcodeFormat;
  points?: Point[];
  rawBytes?: Uint8Array;
}

/**
 * Map from decoder-specific format names to our format names
 */
export type FormatMapping = Record<string, BarcodeFormat>;
