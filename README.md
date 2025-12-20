# Prescription Scanner

[![npm version](https://img.shields.io/npm/v/prescription-scanner.svg)](https://www.npmjs.com/package/prescription-scanner)
[![npm downloads](https://img.shields.io/npm/dm/prescription-scanner.svg)](https://www.npmjs.com/package/prescription-scanner)
[![bundle size](https://img.shields.io/bundlephobia/minzip/prescription-scanner)](https://bundlephobia.com/package/prescription-scanner)
[![license](https://img.shields.io/npm/l/prescription-scanner.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-Powered-654FF0.svg)](https://webassembly.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen.svg)]()
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow?style=flat&logo=buy-me-a-coffee)](https://buymeacoffee.com/marvbuster)

Lightweight WASM barcode scanner for web applications. Supports **DataMatrix** and **QR Code**.

**v1.1.5** - scanBounds API for custom scan areas!

## Features

- Single WASM file with DataMatrix and QR Code support
- Zero dependencies - pure vanilla JavaScript
- **Headless mode** (default) - use without UI for custom integrations
- **Configurable WASM preloading** - lazy, idle, eager, or manual
- PDF support - scan barcodes from PDF files
- Multi-code detection - find all codes in one scan
- Image enhancement - auto upscaling & contrast for better detection
- Works with any framework (React, Vue, Angular, vanilla JS)
- Mobile-optimized camera handling

## Installation

```bash
npm install prescription-scanner
```

## Usage

### Headless Mode (Default)

The scanner runs in headless mode by default - no UI, just the scanning API:

```typescript
import { PrescriptionScanner } from 'prescription-scanner';

const scanner = new PrescriptionScanner({
  preload: 'idle',  // Load WASM when browser is idle
  onReady: () => {
    console.log('WASM loaded, scanner ready!');
    startButton.disabled = false;
  },
  onScan: (result) => {
    console.log('Found:', result.data, result.format);
  }
});

// === Camera Scanning ===

// Start camera in your container
const video = await scanner.startCamera(myContainer);

// Stop scanning and cleanup
scanner.stop();

// === Static Scanning ===

const results = await scanner.scanImage(imgElement);
const results = await scanner.scanImageData(imageData);
const results = await scanner.scanCanvas(canvasElement);
const results = await scanner.scanPDF(pdfFile);
```

### WASM Preloading

The WASM module (~450KB) can be loaded with different strategies:

```typescript
// Load when browser is idle (recommended for best UX)
const scanner = new PrescriptionScanner({
  preload: 'idle',
  onReady: () => button.disabled = false
});

// Load immediately on instantiation
const scanner = new PrescriptionScanner({
  preload: 'eager'
});

// Load on first use (default)
const scanner = new PrescriptionScanner({
  preload: 'lazy'  // or omit - this is the default
});

// Manual loading
const scanner = new PrescriptionScanner({
  preload: false
});
await scanner.preload();  // or scanner.init()
```

| Strategy | When | Use Case |
|----------|------|----------|
| `'idle'` | Browser idle | Best UX - preload without blocking |
| `'eager'` | Immediately | When scanner is primary feature |
| `'lazy'` | First use | Minimal initial load |
| `false` | Manual | Full control over timing |

#### React Example with Loading State

```tsx
const [isReady, setIsReady] = useState(false);
const scannerRef = useRef<PrescriptionScanner | null>(null);

useEffect(() => {
  const scanner = new PrescriptionScanner({
    preload: 'idle',  // Loads WASM when browser is idle
    onReady: () => setIsReady(true),
    onScan: (result) => console.log(result)
  });
  scannerRef.current = scanner;
  return () => scanner.stop();
}, []);

// Button shows loading state until WASM is ready
<button disabled={!isReady} onClick={startCamera}>
  {isReady ? 'Start Camera' : 'Loading...'}
</button>
```

> **Note:** The WASM module is cached globally. Once loaded by any scanner instance, subsequent instances can use it immediately without reloading.

### Browser (IIFE)

```html
<script src="prescription-scanner.global.js"></script>
<script>
  const scanner = new PrescriptionScanner.PrescriptionScanner({
    preload: 'eager',
    onReady: () => console.log('Ready!'),
    onScan: (result) => alert('Scanned: ' + result.data)
  });

  document.getElementById('startBtn').onclick = async () => {
    await scanner.startCamera(document.getElementById('camera'));
  };
</script>
```

## Options

```typescript
interface ScannerOptions {
  // WASM Loading
  preload?: 'idle' | 'eager' | 'lazy' | false;  // Preload strategy (default: 'lazy')

  // Formats to detect
  formats?: ('DataMatrix' | 'QRCode')[];

  // Scan area (optional - default: full frame)
  scanBounds?: ScanBounds;

  // Callbacks
  onReady?: () => void;                   // Called when WASM is loaded
  onScan?: (result: ScanResult) => void;  // Called for each detected code
  onError?: (error: Error) => void;       // Called on errors
}

interface ScanBounds {
  x: number;      // X offset (0-1 relative or pixels)
  y: number;      // Y offset (0-1 relative or pixels)
  width: number;  // Width (0-1 relative or pixels)
  height: number; // Height (0-1 relative or pixels)
}

interface ScanResult {
  data: string;
  format: 'DataMatrix' | 'QRCode';
  timestamp: number;
  points: { x: number; y: number }[];  // Code position in full frame
}
```

## API

### `new PrescriptionScanner(options)`

Creates a new scanner instance.

### Preload Methods

#### `scanner.preload()`

Preload WASM module in background. Returns `Promise<void>`. Triggers `onReady` when complete.

#### `scanner.init()`

Initialize scanner and load WASM. Returns `Promise<void>`. Triggers `onReady` when complete.

#### `scanner.isReady()`

Returns `true` if WASM is loaded and scanner is ready.

### Camera Methods

#### `scanner.startCamera(container)`

Creates a video element in the container, requests camera access, and starts scanning. Returns the video element for custom styling.

#### `scanner.start(videoElement)`

Start scanning on an existing video element (must have camera stream attached).

#### `scanner.stop()`

Stop scanning and clean up camera stream and video element.

#### `scanner.isScanning()`

Returns `true` if currently scanning.

### Static Methods

#### `scanner.scanImage(image)`

Scan an HTMLImageElement. Returns `Promise<ScanResult[]>`.

#### `scanner.scanImageData(imageData)`

Scan ImageData directly. Returns `Promise<ScanResult[]>`.

#### `scanner.scanCanvas(canvas)`

Scan an HTMLCanvasElement. Returns `Promise<ScanResult[]>`.

#### `scanner.scanPDF(file)`

Scan all pages of a PDF file. Returns `Promise<ScanResult[]>`.

### Common Methods

#### `scanner.getResults()`

Returns all scanned results so far.

#### `scanner.clearResults()`

Clears all stored results, allowing the same codes to be scanned again.

#### `scanner.setScanBounds(bounds)`

Set the scan area. Values 0-1 are relative to frame size, >1 are absolute pixels.

```typescript
// Scan center 50% of frame
scanner.setScanBounds({ x: 0.25, y: 0.25, width: 0.5, height: 0.5 });

// Scan full frame (default)
scanner.setScanBounds(null);
```

#### `scanner.getScanBounds()`

Returns current scan bounds or null if scanning full frame.

#### `scanner.getComputedBounds()`

Returns scan bounds in pixels based on current video dimensions.

#### `scanner.destroy()`

Cleanup - stops camera and removes event listeners.

## PDF Support

PDF.js is loaded dynamically from CDN when needed (~200 KB). No additional setup required.

```typescript
import { processPDF, isPDF } from 'prescription-scanner';

// Check if file is PDF
if (isPDF(file)) {
  const pages = await processPDF(file, {
    scale: 2,        // Render at 2x for better recognition
    maxPages: 10,    // Process max 10 pages
    onProgress: (current, total) => {
      console.log(`Processing page ${current}/${total}`);
    }
  });
}
```

## Supported Formats

| Format | Use Case |
|--------|----------|
| **DataMatrix** | German prescriptions (eRezept), medical packaging |
| **QR Code** | General purpose, URLs, vCards |

## Building from Source

### Prerequisites

- Node.js 18+
- Emscripten SDK (for WASM build)

### Build JavaScript

```bash
npm run build
```

### Build WASM (optional)

```bash
npm run build:wasm
```

## Bundle Size

| File | Size |
|------|------|
| scanner.wasm | 442 KB |
| scanner.js | 53 KB |
| index.js (ESM) | 18 KB |
| PDF.js (CDN, lazy) | ~200 KB |
| **Core Total** | **~495 KB** |

WASM loading is configurable via `preload` option: `'lazy'` (default), `'idle'`, `'eager'`, or `false`.
PDF.js is lazy-loaded only when processing PDFs.

## Browser Support

- Chrome 66+
- Firefox 62+
- Safari 12+
- Edge 79+

Requires WebAssembly and getUserMedia (camera) support.

## Changelog

### v1.1.5
- Added `scanBounds` option to limit scan area within video frame
- Added `setScanBounds()`, `getScanBounds()`, `getComputedBounds()` methods
- Bounds support relative (0-1) and absolute pixel values
- Code positions in results are adjusted to full frame coordinates
- Added ScanBounds demo page

### v1.1.4
- Added `clearResults()` method to allow rescanning same codes
- Fixed camera restart bug (camera couldn't restart after stopping)
- Renamed "Built-in Modal Demo" to "Lazyload Demo"
- Added unit tests

### v1.1.3
- **Configurable WASM preloading**: `'idle'`, `'eager'`, `'lazy'`, or `false`
- **onReady callback**: Get notified when WASM is loaded
- Headless mode is now the default (`headless: true`)
- Added camera API: `startCamera(container)`, `start(video)`, `stop()`, `isScanning()`
- Added preload methods: `preload()`, `init()`, `isReady()`
- Added static scan methods: `scanImage()`, `scanImageData()`, `scanCanvas()`, `scanPDF()`
- Fixed modal scrolling when many codes are scanned
- Added proper Apache 2.0 attribution for zxing-cpp

### v1.1.2
- Fixed README: clarified API classes

### v1.1.1
- Updated README and package.json documentation

### v1.1.0
- Added PDF support with PDF.js
- Added multi-code detection
- Added file upload UI (drag & drop)
- Added image enhancement (upscaling, contrast adjustment)
- Added `onMultiScan` callback
- Added `getResults()` method
- Added `enhanceForScanning()` utility

### v1.0.0
- Initial release

## Third-Party Licenses

This package includes [zxing-cpp](https://github.com/zxing-cpp/zxing-cpp) for barcode decoding, licensed under Apache 2.0. See [THIRD-PARTY-NOTICES](./THIRD-PARTY-NOTICES) for details.

## License

MIT (this package) AND Apache-2.0 (zxing-cpp)
