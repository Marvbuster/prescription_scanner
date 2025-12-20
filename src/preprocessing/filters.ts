import type { GrayscaleImage } from '../types';

/**
 * Apply 3x3 convolution kernel to grayscale image
 */
function convolve3x3(gray: GrayscaleImage, kernel: number[]): GrayscaleImage {
  const { data, width, height } = gray;
  const result = new Uint8Array(data.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      let k = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          sum += data[idx] * kernel[k++];
        }
      }

      // Clamp result to 0-255
      result[y * width + x] = Math.max(0, Math.min(255, Math.round(sum)));
    }
  }

  // Copy border pixels
  for (let x = 0; x < width; x++) {
    result[x] = data[x];
    result[(height - 1) * width + x] = data[(height - 1) * width + x];
  }
  for (let y = 0; y < height; y++) {
    result[y * width] = data[y * width];
    result[y * width + width - 1] = data[y * width + width - 1];
  }

  return { data: result, width, height };
}

/**
 * Sharpen image using Laplacian kernel
 */
export function sharpen(gray: GrayscaleImage): GrayscaleImage {
  // Laplacian sharpening kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0,
  ];

  return convolve3x3(gray, kernel);
}

/**
 * Light sharpening - less aggressive
 */
export function sharpenLight(gray: GrayscaleImage): GrayscaleImage {
  const kernel = [
    0, -0.5, 0,
    -0.5, 3, -0.5,
    0, -0.5, 0,
  ];

  return convolve3x3(gray, kernel);
}

/**
 * Apply Gaussian blur (3x3) for noise reduction
 */
export function gaussianBlur(gray: GrayscaleImage): GrayscaleImage {
  // 3x3 Gaussian kernel (sigma ≈ 0.85)
  const kernel = [
    1 / 16, 2 / 16, 1 / 16,
    2 / 16, 4 / 16, 2 / 16,
    1 / 16, 2 / 16, 1 / 16,
  ];

  return convolve3x3(gray, kernel);
}

/**
 * Simple box blur (fast)
 */
export function boxBlur(gray: GrayscaleImage): GrayscaleImage {
  const kernel = [
    1 / 9, 1 / 9, 1 / 9,
    1 / 9, 1 / 9, 1 / 9,
    1 / 9, 1 / 9, 1 / 9,
  ];

  return convolve3x3(gray, kernel);
}

/**
 * Median filter for salt-and-pepper noise (3x3 window)
 * More expensive but preserves edges better than blur
 */
export function medianFilter(gray: GrayscaleImage): GrayscaleImage {
  const { data, width, height } = gray;
  const result = new Uint8Array(data.length);
  const window = new Uint8Array(9);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let k = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          window[k++] = data[(y + ky) * width + (x + kx)];
        }
      }

      // Sort and take median
      window.sort();
      result[y * width + x] = window[4];
    }
  }

  // Copy border pixels
  for (let x = 0; x < width; x++) {
    result[x] = data[x];
    result[(height - 1) * width + x] = data[(height - 1) * width + x];
  }
  for (let y = 0; y < height; y++) {
    result[y * width] = data[y * width];
    result[y * width + width - 1] = data[y * width + width - 1];
  }

  return { data: result, width, height };
}

/**
 * Enhance contrast using histogram stretching
 */
export function stretchContrast(gray: GrayscaleImage): GrayscaleImage {
  const { data, width, height } = gray;

  // Find min and max values
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }

  // Avoid division by zero
  if (max === min) {
    return { data: new Uint8Array(data), width, height };
  }

  // Stretch to full range
  const result = new Uint8Array(data.length);
  const scale = 255 / (max - min);

  for (let i = 0; i < data.length; i++) {
    result[i] = Math.round((data[i] - min) * scale);
  }

  return { data: result, width, height };
}
