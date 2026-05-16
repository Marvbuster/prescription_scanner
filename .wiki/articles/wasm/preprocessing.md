---
title: "Preprocessing — Upscale, Sharpen, Binarize"
created: 2026-05-14
updated: 2026-05-14
category: wasm
tags: [preprocessing, upscale, binarize, sharpen]
status: current
related:
  - wasm/wasm-build
  - api/simple-api
code_refs:
  - src/preprocessing/
---

# Preprocessing — Upscale, Sharpen, Binarize

Bevor das WASM-Modul ein Bild scannt, kann es per Preprocessing aufbereitet werden. Optional — der zxing-cpp-Core ist robust und kommt mit Roh-RGBA gut zurecht. Preprocessing kann aber **schwache Codes** rettbar machen (verwaschen, Low-Contrast, klein).

## Module unter `src/preprocessing/`

| Datei | Inhalt |
|-------|--------|
| `index.ts` | Public API (`preprocess`, `enhanceForScanning`) |
| `grayscale.ts` | RGBA → 8-bit Grayscale |
| `binarize.ts` | Otsu, Adaptive Threshold |
| `filters.ts` | Sharpen, Gaussian-/Box-Blur, Median-Filter, Stretch-Contrast |
| `enhance.ts` | Upscale (Bilinear), Brightness/Contrast, RGBA-Sharpen, `enhanceForScanning` |

## Public-Funktionen

```ts
import {
  preprocess, toGrayscale, toImageData,
  binarizeOtsu, adaptiveThreshold, otsuThreshold, binarize,
  invert, sharpen, sharpenLight,
  gaussianBlur, boxBlur, medianFilter, stretchContrast,
  grayscaleToRGBA,
  upscaleImage, adjustBrightnessContrast, sharpenRGBA,
  enhanceForScanning,
} from 'prescription-scanner';
```

## `enhanceForScanning` — All-in-One

```ts
const enhanced = enhanceForScanning(imageData, {
  upscale: 2.5,
  sharpen: true,
  contrast: 1.2,
});
const results = await scan(enhanced);
```

Anwendung:

1. Upscale (Bilinear-Interpolation) auf das gewünschte Vielfache (Default 2.5x)
2. Brightness/Contrast-Adjust
3. RGBA-Sharpen (Unsharp-Mask)

Output: neues `ImageData`. Original bleibt unverändert.

⚠️ **Memory**: Upscale 2.5x = 6.25x Pixel-Count. Für 4MP-Bild plötzlich 25 MP × 4 Bytes = 100 MB. Vorsicht bei Mobile.

## Upscale-Algorithmus

`enhance.ts::upscaleImage()`:

Bilinear-Interpolation:

```ts
const x0 = Math.floor(srcX);
const y0 = Math.floor(srcY);
const x1 = Math.min(x0 + 1, width - 1);
const y1 = Math.min(y0 + 1, height - 1);
const xFrac = srcX - x0;
const yFrac = srcY - y0;

// Für jeden Channel:
const tl = data[(y0 * width + x0) * 4 + c];
const tr = data[(y0 * width + x1) * 4 + c];
const bl = data[(y1 * width + x0) * 4 + c];
const br = data[(y1 * width + x1) * 4 + c];
const top = tl + (tr - tl) * xFrac;
const bottom = bl + (br - bl) * xFrac;
const value = top + (bottom - top) * yFrac;
```

Bilinear ist schnell und gut genug für Barcode-Hochskalierung. Bicubic wäre besser, kostet aber 4x so lange.

## Grayscale

`grayscale.ts`:

```ts
gray = 0.299 * R + 0.587 * G + 0.114 * B;
```

Luma-Gewichtung (ITU-R BT.601). Für Barcode-Decoding wichtiger als reine Averaging.

## Binarize

| Methode | Wann |
|---------|------|
| `otsuThreshold` | global, Bi-Modal-Histogramme (klassische Light/Dark-Codes) |
| `adaptiveThreshold` | lokal (window-based), ungleiche Beleuchtung |

Otsu findet automatisch den optimalen Schwellenwert. Adaptive macht das **pro Pixel-Window** — robuster bei Schatten/Beleuchtungs-Gradients.

## Sharpen

`filters.ts::sharpen()`:

3×3-Kernel:

```
 0 -1  0
-1  5 -1
 0 -1  0
```

Klassischer Sharpen — hebt Kanten an. Für Barcode-Pixel-Borders nützlich.

`sharpenLight` ist eine schwächere Variante (Kernel-Center = 3 statt 5).

## Wann was anwenden

| Bild-Problem | Empfehlung |
|--------------|------------|
| Foto ist zu klein (Smartphone-Crop) | `upscaleImage(img, 2.5)` |
| Code ist unscharf | `sharpenRGBA` oder `enhanceForScanning(opts.sharpen = true)` |
| Niedriger Kontrast (verblasst, Lichtspiegelung) | `adjustBrightnessContrast(img, 0, 1.3)` |
| Ungleichmäßig beleuchtet | `adaptiveThreshold` (nach `toGrayscale`) |
| Inverses Bild (weiß auf schwarz) | `invert` |

## Performance

| Operation | 1 MP | 4 MP |
|-----------|------|------|
| Grayscale | ~5 ms | ~20 ms |
| Otsu | ~15 ms | ~60 ms |
| Adaptive Threshold | ~80 ms | ~320 ms |
| Upscale 2.5x | ~30 ms | ~120 ms |
| Sharpen | ~50 ms | ~200 ms |
| `enhanceForScanning` (full) | ~120 ms | ~500 ms |

Auf einem M1 Mac. Mobile ist langsamer.

## Default-Verhalten

Beim Standard-Scan **wird kein Preprocessing angewendet**. Der WASM-Decoder bekommt direkt das Roh-RGBA. Preprocessing ist Opt-In für schwierige Cases.

Im Continuous-Scanning-Loop (`startCamera`) wäre Preprocessing per Frame zu teuer — daher dort meistens unbenutzt.

## Edge Cases

| Fall | Verhalten |
|------|-----------|
| Bild kleiner als Kernel (3×3) | Filter überspringt diese Pixel, Output identisch |
| Alle Pixel transparent (Alpha=0) | Otsu wirft Division-by-zero — Caller muss filtern |
| Upscale-Factor < 1 (downscale) | funktioniert, aber Detail-Verlust — meist sinnlos |
| Negative-Kontrast > 0 (`adjustBrightnessContrast(-1, ...)`) | Pixels clampen auf 0–255 |

## Verwandte Artikel

- [WASM-Build](wasm-build.md)
- [Simple-API](../api/simple-api.md)
