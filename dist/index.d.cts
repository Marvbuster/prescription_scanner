/**
 * Supported barcode formats
 */
type BarcodeFormat = 'QRCode' | 'DataMatrix';
/**
 * Result of a successful barcode scan
 */
interface ScanResult {
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
interface Point {
    x: number;
    y: number;
}
/**
 * Preprocessing options
 */
interface PreprocessingOptions {
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
interface CameraOptions {
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
 * Scanner event types
 */
interface ScannerEvents {
    scan: (result: ScanResult) => void;
    error: (error: Error) => void;
    start: () => void;
    stop: () => void;
}
/**
 * Internal image data for processing
 */
interface GrayscaleImage {
    data: Uint8Array;
    width: number;
    height: number;
}

/**
 * PRESCRIPTION SCANNER v1.1 - Vanilla JS Modal
 * Zero dependencies, mit PDF & Multi-Code Support
 */

type PreloadStrategy = 'idle' | 'eager' | 'lazy' | false;
interface ScannerOptions {
    /** Headless mode - no modal UI, just scanning API */
    headless?: boolean;
    /**
     * WASM preload strategy:
     * - 'lazy' (default): Load on first use
     * - 'idle': Load when browser is idle (requestIdleCallback)
     * - 'eager': Load immediately on instantiation
     * - false: Manual loading via preload() or init()
     */
    preload?: PreloadStrategy;
    /** Formate die gescannt werden sollen */
    formats?: BarcodeFormat[];
    /** Modal-Titel */
    title?: string;
    /** Button-Text */
    buttonText?: string;
    /** Nach erfolgreichem Scan schließen */
    closeOnScan?: boolean;
    /** Callback when WASM is loaded and scanner is ready */
    onReady?: () => void;
    /** Callback bei Scan (wird für jeden gefundenen Code aufgerufen) */
    onScan?: (result: ScanResult) => void;
    /** Callback bei mehreren Codes auf einmal */
    onMultiScan?: (results: ScanResult[]) => void;
    /** Callback bei Fehler */
    onError?: (error: Error) => void;
    /** Callback wenn Modal schließt */
    onClose?: () => void;
}
declare class PrescriptionScanner {
    private options;
    private scanner;
    private overlay;
    private video;
    private stream;
    private stylesInjected;
    private results;
    private mode;
    private fileInput;
    private initialized;
    private initializing;
    constructor(options?: ScannerOptions);
    /**
     * Handle preload strategy
     */
    private handlePreload;
    /**
     * Preload WASM module in background
     * Triggers onReady callback when complete
     */
    preload(): Promise<void>;
    /**
     * Initialize scanner and load WASM
     * Triggers onReady callback when complete
     */
    init(): Promise<void>;
    /**
     * Check if WASM is loaded and scanner is ready
     */
    isReady(): boolean;
    /**
     * Scan an image element (headless mode)
     */
    scanImage(image: HTMLImageElement): Promise<ScanResult[]>;
    /**
     * Scan ImageData directly (headless mode)
     */
    scanImageData(imageData: ImageData): Promise<ScanResult[]>;
    /**
     * Scan a canvas element (headless mode)
     */
    scanCanvas(canvas: HTMLCanvasElement): Promise<ScanResult[]>;
    /**
     * Scan a PDF file (headless mode)
     */
    scanPDF(file: File | ArrayBuffer): Promise<ScanResult[]>;
    /**
     * Start continuous scanning on a video element (headless mode)
     * The video element must already have a camera stream attached
     */
    start(videoElement: HTMLVideoElement): Promise<void>;
    /**
     * Start camera and scanning in a container (headless mode)
     * Creates a video element and requests camera access
     * Returns the video element for custom styling
     */
    startCamera(container: HTMLElement): Promise<HTMLVideoElement>;
    /**
     * Stop camera scanning (headless mode)
     * Cleans up camera stream and video element
     */
    stop(): void;
    /**
     * Check if currently scanning
     */
    isScanning(): boolean;
    /**
     * Erstellt einen Button der das Scanner-Modal öffnet
     */
    createButton(container?: HTMLElement): HTMLButtonElement;
    /**
     * Öffnet das Scanner-Modal
     */
    open(): Promise<void>;
    /**
     * Schließt das Scanner-Modal
     */
    close(): void;
    /**
     * Cleanup - alle Ressourcen freigeben
     */
    destroy(): void;
    /**
     * Gibt alle bisher gefundenen Ergebnisse zurück
     */
    getResults(): ScanResult[];
    /**
     * Löscht alle bisher gefundenen Ergebnisse
     */
    clearResults(): void;
    private injectStyles;
    private createModal;
    private setupUploadZone;
    private switchMode;
    private processFile;
    private loadImage;
    private deduplicateResults;
    private startScanner;
    private stopScanner;
    private addResult;
    private updateResultsUI;
    private escapeHtml;
}
/**
 * Schnellstart - öffnet direkt einen Scanner
 */
declare function openScanner(options?: ScannerOptions): PrescriptionScanner;

/**
 * PRESCRIPTION SCANNER - Super Simple API
 *
 * Usage:
 *
 *   import { scan, scanVideo } from 'prescription-scanner';
 *
 *   // Scan from image
 *   const result = await scan(imageElement);
 *   console.log(result); // { data: '...', format: 'DataMatrix' }
 *
 *   // Scan continuously from video
 *   const stop = await scanVideo(videoElement, (result) => {
 *     console.log('Found:', result.data);
 *   });
 *   // Later: stop();
 */

/**
 * Scan a single image for barcodes
 *
 * @example
 * const img = document.querySelector('img');
 * const result = await scan(img);
 * if (result) {
 *   console.log(result.data, result.format);
 * }
 */
declare function scan(source: HTMLImageElement | HTMLCanvasElement | ImageData): Promise<ScanResult | null>;
/**
 * Scan all barcodes from an image
 *
 * @example
 * const results = await scanAll(img);
 * results.forEach(r => console.log(r.data));
 */
declare function scanAll(source: HTMLImageElement | HTMLCanvasElement | ImageData): Promise<ScanResult[]>;
/**
 * Continuously scan from a video element
 *
 * @example
 * const video = document.querySelector('video');
 * const stop = await scanVideo(video, (result) => {
 *   console.log('Scanned:', result.data);
 *   stop(); // Stop after first scan
 * });
 *
 * // Or stop later:
 * setTimeout(stop, 10000);
 */
declare function scanVideo(video: HTMLVideoElement, onScan: (result: ScanResult) => void, options?: {
    onError?: (error: Error) => void;
}): Promise<() => void>;
/**
 * Request camera access and start scanning
 * Creates a video element automatically
 *
 * @example
 * const { video, stop } = await startScanner((result) => {
 *   console.log('Found:', result.data);
 * });
 * document.body.appendChild(video);
 *
 * // Later:
 * stop();
 */
declare function startScanner(onScan: (result: ScanResult) => void, options?: {
    container?: HTMLElement;
    onError?: (error: Error) => void;
}): Promise<{
    video: HTMLVideoElement;
    stop: () => void;
}>;
/**
 * Clean up scanner resources
 * Call this when you're done scanning
 */
declare function cleanup(): void;

/**
 * Convert RGBA ImageData to grayscale using luminosity method
 * Uses the formula: Y = 0.299*R + 0.587*G + 0.114*B
 * This matches human perception of brightness
 */
declare function toGrayscale(imageData: ImageData): GrayscaleImage;
/**
 * Convert grayscale back to ImageData (for debugging/visualization)
 */
declare function toImageData(gray: GrayscaleImage): ImageData;

/**
 * Calculate optimal threshold using Otsu's method
 * Finds the threshold that minimizes intra-class variance
 */
declare function otsuThreshold(gray: GrayscaleImage): number;
/**
 * Apply global threshold binarization
 */
declare function binarize(gray: GrayscaleImage, threshold: number): GrayscaleImage;
/**
 * Apply Otsu's binarization (auto-threshold)
 */
declare function binarizeOtsu(gray: GrayscaleImage): GrayscaleImage;
/**
 * Adaptive threshold using mean of local neighborhood
 * Better for images with uneven lighting
 */
declare function adaptiveThreshold(gray: GrayscaleImage, blockSize?: number, c?: number): GrayscaleImage;
/**
 * Invert a grayscale/binary image
 */
declare function invert(gray: GrayscaleImage): GrayscaleImage;

/**
 * Sharpen image using Laplacian kernel
 */
declare function sharpen(gray: GrayscaleImage): GrayscaleImage;
/**
 * Light sharpening - less aggressive
 */
declare function sharpenLight(gray: GrayscaleImage): GrayscaleImage;
/**
 * Apply Gaussian blur (3x3) for noise reduction
 */
declare function gaussianBlur(gray: GrayscaleImage): GrayscaleImage;
/**
 * Simple box blur (fast)
 */
declare function boxBlur(gray: GrayscaleImage): GrayscaleImage;
/**
 * Median filter for salt-and-pepper noise (3x3 window)
 * More expensive but preserves edges better than blur
 */
declare function medianFilter(gray: GrayscaleImage): GrayscaleImage;
/**
 * Enhance contrast using histogram stretching
 */
declare function stretchContrast(gray: GrayscaleImage): GrayscaleImage;

/**
 * Image Enhancement - Upscaling & Auto-Enhancement
 */
/**
 * Upscale ImageData using bilinear interpolation
 * Based on wendorf_demo's 2.5x upscaling strategy
 */
declare function upscaleImage(imageData: ImageData, scale?: number): ImageData;
/**
 * Adjust brightness and contrast on ImageData (RGBA)
 */
declare function adjustBrightnessContrast(imageData: ImageData, brightness?: number, contrast?: number): ImageData;
/**
 * Simple sharpening on RGBA ImageData
 */
declare function sharpenRGBA(imageData: ImageData): ImageData;
interface EnhanceOptions {
    /** Upscale images smaller than this (default: 1000) */
    minSize?: number;
    /** Upscale factor (default: 2.5) */
    upscaleFactor?: number;
    /** Apply brightness/contrast adjustment */
    adjustColors?: boolean;
    /** Apply sharpening */
    sharpen?: boolean;
}
/**
 * Auto-enhance image for better barcode detection
 */
declare function enhanceForScanning(imageData: ImageData, options?: EnhanceOptions): ImageData;

/**
 * Apply preprocessing pipeline to ImageData
 */
declare function preprocess(imageData: ImageData, options?: PreprocessingOptions): GrayscaleImage;
/**
 * Convert GrayscaleImage to Uint8ClampedArray (RGBA) for display
 */
declare function grayscaleToRGBA(gray: GrayscaleImage): Uint8ClampedArray;

interface CameraStream {
    video: HTMLVideoElement;
    stream: MediaStream;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
}
/**
 * Request camera access and set up video stream
 */
declare function startCamera(videoElement: HTMLVideoElement, options?: CameraOptions): Promise<CameraStream>;
/**
 * Stop camera stream
 */
declare function stopCamera(cameraStream: CameraStream): void;
/**
 * Grab current frame from video as ImageData
 */
declare function grabFrame(camera: CameraStream): ImageData;
/**
 * Check if camera is supported
 */
declare function isCameraSupported(): boolean;
/**
 * Get available cameras
 */
declare function getAvailableCameras(): Promise<MediaDeviceInfo[]>;

/**
 * Interface for barcode decoders
 */
interface BarcodeDecoder {
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
    decode(imageData: ImageData, formats: BarcodeFormat[]): Promise<DecodedBarcode[]>;
    /** Clean up resources */
    destroy(): void;
}
/**
 * Raw decoded barcode data from a decoder
 */
interface DecodedBarcode {
    data: string;
    format: BarcodeFormat;
    points?: Point[];
    rawBytes?: Uint8Array;
}

/**
 * Custom Scanner WASM - 495 KB for DataMatrix & QR Code
 */

declare class ScannerWasmDecoder implements BarcodeDecoder {
    name: string;
    supportedFormats: BarcodeFormat[];
    private module;
    private ready;
    private loading;
    init(): Promise<void>;
    private loadModule;
    private loadScript;
    isReady(): boolean;
    decode(imageData: ImageData, formats: BarcodeFormat[]): Promise<DecodedBarcode[]>;
    destroy(): void;
}

/**
 * Combined Decoder - uses zxing-cpp WASM
 * Supports: DataMatrix, QRCode
 * Size: ~495 KB
 */
declare class CombinedDecoder {
    private decoder;
    private initialized;
    constructor();
    init(formats: BarcodeFormat[]): Promise<void>;
    decode(imageData: ImageData, formats: BarcodeFormat[]): Promise<ScanResult[]>;
    getSupportedFormats(): BarcodeFormat[];
    isReady(): boolean;
    destroy(): void;
}

/**
 * PDF Processor - Extracts images from PDFs for barcode scanning
 * Uses PDF.js loaded dynamically from CDN
 */
/**
 * Result of PDF processing
 */
interface PDFPage {
    pageNumber: number;
    imageData: ImageData;
    width: number;
    height: number;
}
/**
 * Options for PDF processing
 */
interface PDFProcessOptions {
    /** Scale factor for rendering (default: 2 for better recognition) */
    scale?: number;
    /** Maximum pages to process (default: 10) */
    maxPages?: number;
    /** Progress callback */
    onProgress?: (current: number, total: number) => void;
}
/**
 * Process a PDF file and extract pages as ImageData
 */
declare function processPDF(file: File | ArrayBuffer, options?: PDFProcessOptions): Promise<PDFPage[]>;
/**
 * Check if a file is a PDF
 */
declare function isPDF(file: File): boolean;
/**
 * Check if PDF.js is loaded
 */
declare function isPdfJsLoaded(): boolean;

export { type BarcodeDecoder, type BarcodeFormat, type CameraOptions, type CameraStream, CombinedDecoder, type DecodedBarcode, type EnhanceOptions, type GrayscaleImage, type PDFPage, type PDFProcessOptions, type Point, type PreloadStrategy, type PreprocessingOptions, PrescriptionScanner, type ScanResult, type ScannerEvents, type ScannerOptions, ScannerWasmDecoder, adaptiveThreshold, adjustBrightnessContrast, binarize, binarizeOtsu, boxBlur, cleanup, enhanceForScanning, gaussianBlur, getAvailableCameras, grabFrame, grayscaleToRGBA, invert, isCameraSupported, isPDF, isPdfJsLoaded, medianFilter, openScanner, otsuThreshold, preprocess, processPDF, scan, scanAll, scanVideo, sharpen, sharpenLight, sharpenRGBA, startCamera, startScanner, stopCamera, stretchContrast, toGrayscale, toImageData, upscaleImage };
