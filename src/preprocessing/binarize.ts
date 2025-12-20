import type { GrayscaleImage } from '../types';

/**
 * Calculate optimal threshold using Otsu's method
 * Finds the threshold that minimizes intra-class variance
 */
export function otsuThreshold(gray: GrayscaleImage): number {
  const { data } = gray;

  // Build histogram
  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i++) {
    histogram[data[i]]++;
  }

  const total = data.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let threshold = 0;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;

    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];

    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }

  return threshold;
}

/**
 * Apply global threshold binarization
 */
export function binarize(gray: GrayscaleImage, threshold: number): GrayscaleImage {
  const { data, width, height } = gray;
  const result = new Uint8Array(data.length);

  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] > threshold ? 255 : 0;
  }

  return { data: result, width, height };
}

/**
 * Apply Otsu's binarization (auto-threshold)
 */
export function binarizeOtsu(gray: GrayscaleImage): GrayscaleImage {
  const threshold = otsuThreshold(gray);
  return binarize(gray, threshold);
}

/**
 * Adaptive threshold using mean of local neighborhood
 * Better for images with uneven lighting
 */
export function adaptiveThreshold(
  gray: GrayscaleImage,
  blockSize: number = 11,
  c: number = 2
): GrayscaleImage {
  const { data, width, height } = gray;
  const result = new Uint8Array(data.length);

  // Ensure blockSize is odd
  const halfBlock = Math.floor(blockSize / 2);

  // Use integral image for fast local mean computation
  const integral = new Uint32Array((width + 1) * (height + 1));

  // Build integral image
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += data[y * width + x];
      const idx = (y + 1) * (width + 1) + (x + 1);
      integral[idx] = rowSum + integral[idx - (width + 1)];
    }
  }

  // Apply adaptive threshold
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate block bounds
      const x1 = Math.max(0, x - halfBlock);
      const y1 = Math.max(0, y - halfBlock);
      const x2 = Math.min(width - 1, x + halfBlock);
      const y2 = Math.min(height - 1, y + halfBlock);

      // Calculate sum using integral image
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum =
        integral[(y2 + 1) * (width + 1) + (x2 + 1)] -
        integral[(y1) * (width + 1) + (x2 + 1)] -
        integral[(y2 + 1) * (width + 1) + (x1)] +
        integral[(y1) * (width + 1) + (x1)];

      const mean = sum / count;
      const idx = y * width + x;

      // Apply threshold with constant offset
      result[idx] = data[idx] > mean - c ? 255 : 0;
    }
  }

  return { data: result, width, height };
}

/**
 * Invert a grayscale/binary image
 */
export function invert(gray: GrayscaleImage): GrayscaleImage {
  const { data, width, height } = gray;
  const result = new Uint8Array(data.length);

  for (let i = 0; i < data.length; i++) {
    result[i] = 255 - data[i];
  }

  return { data: result, width, height };
}
