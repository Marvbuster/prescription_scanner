import type { GrayscaleImage } from '../types';

/**
 * Convert RGBA ImageData to grayscale using luminosity method
 * Uses the formula: Y = 0.299*R + 0.587*G + 0.114*B
 * This matches human perception of brightness
 */
export function toGrayscale(imageData: ImageData): GrayscaleImage {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);

  for (let i = 0; i < gray.length; i++) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    // Luminosity method - better perceptual accuracy
    gray[i] = (r * 77 + g * 150 + b * 29) >> 8;
  }

  return { data: gray, width, height };
}

/**
 * Convert grayscale back to ImageData (for debugging/visualization)
 */
export function toImageData(gray: GrayscaleImage): ImageData {
  const { data, width, height } = gray;
  const imageData = new ImageData(width, height);

  for (let i = 0; i < data.length; i++) {
    const offset = i * 4;
    const v = data[i];
    imageData.data[offset] = v;     // R
    imageData.data[offset + 1] = v; // G
    imageData.data[offset + 2] = v; // B
    imageData.data[offset + 3] = 255; // A
  }

  return imageData;
}
