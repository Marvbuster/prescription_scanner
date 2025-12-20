import type { GrayscaleImage, PreprocessingOptions } from '../types';
import { toGrayscale, toImageData } from './grayscale';
import { binarizeOtsu, adaptiveThreshold, invert } from './binarize';
import { sharpen, gaussianBlur, medianFilter, stretchContrast } from './filters';

export { toGrayscale, toImageData } from './grayscale';
export { binarizeOtsu, adaptiveThreshold, otsuThreshold, binarize, invert } from './binarize';
export { sharpen, sharpenLight, gaussianBlur, boxBlur, medianFilter, stretchContrast } from './filters';

/**
 * Apply preprocessing pipeline to ImageData
 */
export function preprocess(
  imageData: ImageData,
  options: PreprocessingOptions = {}
): GrayscaleImage {
  const {
    binarize = 'none',
    sharpen: doSharpen = false,
    denoise = false,
    invert: doInvert = false,
  } = options;

  // Step 1: Convert to grayscale
  let result = toGrayscale(imageData);

  // Step 2: Denoise (before other processing)
  if (denoise) {
    result = gaussianBlur(result);
  }

  // Step 3: Sharpen (if not binarizing, sharpening helps)
  if (doSharpen) {
    result = sharpen(result);
  }

  // Step 4: Binarize
  if (binarize === 'otsu') {
    result = binarizeOtsu(result);
  } else if (binarize === 'adaptive') {
    result = adaptiveThreshold(result);
  }

  // Step 5: Invert if needed
  if (doInvert) {
    result = invert(result);
  }

  return result;
}

/**
 * Convert GrayscaleImage to Uint8ClampedArray (RGBA) for display
 */
export function grayscaleToRGBA(gray: GrayscaleImage): Uint8ClampedArray {
  const { data, width, height } = gray;
  const rgba = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < data.length; i++) {
    const offset = i * 4;
    const v = data[i];
    rgba[offset] = v;     // R
    rgba[offset + 1] = v; // G
    rgba[offset + 2] = v; // B
    rgba[offset + 3] = 255; // A
  }

  return rgba;
}
