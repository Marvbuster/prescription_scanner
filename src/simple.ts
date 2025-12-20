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

import type { BarcodeFormat, ScanResult, PreprocessingOptions } from './types';
import { SuperScanner } from './scanner';

// Singleton scanner instance
let sharedScanner: SuperScanner | null = null;

/**
 * Get or create the shared scanner instance
 */
async function getScanner(): Promise<SuperScanner> {
  if (!sharedScanner) {
    sharedScanner = new SuperScanner({
      formats: ['DataMatrix', 'QRCode'],
    });
    await sharedScanner.init();
  }
  return sharedScanner;
}

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
export async function scan(
  source: HTMLImageElement | HTMLCanvasElement | ImageData
): Promise<ScanResult | null> {
  const scanner = await getScanner();

  let results: ScanResult[];

  if (source instanceof HTMLImageElement) {
    results = await scanner.scanImage(source);
  } else if (source instanceof HTMLCanvasElement) {
    results = await scanner.scanCanvas(source);
  } else {
    results = await scanner.scanImageData(source);
  }

  return results[0] || null;
}

/**
 * Scan all barcodes from an image
 *
 * @example
 * const results = await scanAll(img);
 * results.forEach(r => console.log(r.data));
 */
export async function scanAll(
  source: HTMLImageElement | HTMLCanvasElement | ImageData
): Promise<ScanResult[]> {
  const scanner = await getScanner();

  if (source instanceof HTMLImageElement) {
    return scanner.scanImage(source);
  } else if (source instanceof HTMLCanvasElement) {
    return scanner.scanCanvas(source);
  } else {
    return scanner.scanImageData(source);
  }
}

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
export async function scanVideo(
  video: HTMLVideoElement,
  onScan: (result: ScanResult) => void,
  options?: {
    onError?: (error: Error) => void;
  }
): Promise<() => void> {
  const scanner = await getScanner();

  scanner.on('scan', onScan);

  if (options?.onError) {
    scanner.on('error', options.onError);
  }

  await scanner.start(video);

  // Return stop function
  return () => {
    scanner.stop();
    scanner.off('scan', onScan);
    if (options?.onError) {
      scanner.off('error', options.onError);
    }
  };
}

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
export async function startScanner(
  onScan: (result: ScanResult) => void,
  options?: {
    container?: HTMLElement;
    onError?: (error: Error) => void;
  }
): Promise<{ video: HTMLVideoElement; stop: () => void }> {
  // Create video element
  const video = document.createElement('video');
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.style.width = '100%';
  video.style.height = 'auto';

  // Append to container if provided
  if (options?.container) {
    options.container.appendChild(video);
  }

  const stop = await scanVideo(video, onScan, options);

  return {
    video,
    stop: () => {
      stop();
      if (options?.container && video.parentNode === options.container) {
        options.container.removeChild(video);
      }
    },
  };
}

/**
 * Clean up scanner resources
 * Call this when you're done scanning
 */
export function cleanup(): void {
  if (sharedScanner) {
    sharedScanner.destroy();
    sharedScanner = null;
  }
}
