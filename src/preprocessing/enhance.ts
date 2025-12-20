/**
 * Image Enhancement - Upscaling & Auto-Enhancement
 */

/**
 * Upscale ImageData using bilinear interpolation
 * Based on wendorf_demo's 2.5x upscaling strategy
 */
export function upscaleImage(imageData: ImageData, scale: number = 2.5): ImageData {
  const { data, width, height } = imageData;
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);
  const newData = new Uint8ClampedArray(newWidth * newHeight * 4);

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      // Map back to source coordinates
      const srcX = (x / scale);
      const srcY = (y / scale);

      // Get integer and fractional parts
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, width - 1);
      const y1 = Math.min(y0 + 1, height - 1);
      const xFrac = srcX - x0;
      const yFrac = srcY - y0;

      // Bilinear interpolation for each channel
      const destIdx = (y * newWidth + x) * 4;

      for (let c = 0; c < 4; c++) {
        const tl = data[(y0 * width + x0) * 4 + c];
        const tr = data[(y0 * width + x1) * 4 + c];
        const bl = data[(y1 * width + x0) * 4 + c];
        const br = data[(y1 * width + x1) * 4 + c];

        const top = tl + (tr - tl) * xFrac;
        const bottom = bl + (br - bl) * xFrac;
        const value = top + (bottom - top) * yFrac;

        newData[destIdx + c] = Math.round(value);
      }
    }
  }

  return new ImageData(newData, newWidth, newHeight);
}

/**
 * Adjust brightness and contrast on ImageData (RGBA)
 */
export function adjustBrightnessContrast(
  imageData: ImageData,
  brightness: number = 1.1,
  contrast: number = 1.3
): ImageData {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      // Apply contrast (around midpoint 128) then brightness
      let value = data[i + c];
      value = ((value - 128) * contrast) + 128;
      value = value * brightness;
      newData[i + c] = Math.max(0, Math.min(255, Math.round(value)));
    }
    newData[i + 3] = data[i + 3]; // Keep alpha
  }

  return new ImageData(newData, width, height);
}

/**
 * Simple sharpening on RGBA ImageData
 */
export function sharpenRGBA(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(data.length);

  // Laplacian sharpening kernel
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const destIdx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let k = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const srcIdx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[srcIdx] * kernel[k++];
          }
        }
        newData[destIdx + c] = Math.max(0, Math.min(255, Math.round(sum)));
      }
      newData[destIdx + 3] = data[destIdx + 3]; // Keep alpha
    }
  }

  // Copy border pixels
  for (let x = 0; x < width; x++) {
    for (let c = 0; c < 4; c++) {
      newData[x * 4 + c] = data[x * 4 + c];
      newData[((height - 1) * width + x) * 4 + c] = data[((height - 1) * width + x) * 4 + c];
    }
  }
  for (let y = 0; y < height; y++) {
    for (let c = 0; c < 4; c++) {
      newData[(y * width) * 4 + c] = data[(y * width) * 4 + c];
      newData[(y * width + width - 1) * 4 + c] = data[(y * width + width - 1) * 4 + c];
    }
  }

  return new ImageData(newData, width, height);
}

export interface EnhanceOptions {
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
export function enhanceForScanning(
  imageData: ImageData,
  options: EnhanceOptions = {}
): ImageData {
  const {
    minSize = 1000,
    upscaleFactor = 2.5,
    adjustColors = true,
    sharpen = false,
  } = options;

  let result = imageData;

  // Upscale small images
  if (result.width < minSize && result.height < minSize) {
    result = upscaleImage(result, upscaleFactor);
  }

  // Adjust brightness/contrast
  if (adjustColors) {
    result = adjustBrightnessContrast(result, 1.1, 1.2);
  }

  // Sharpen (optional, can cause artifacts)
  if (sharpen) {
    result = sharpenRGBA(result);
  }

  return result;
}
