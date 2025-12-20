# Prescription Scanner

Lightweight WASM barcode scanner for web applications. Supports **DataMatrix** and **QR Code**.

**v1.1** - Now with **PDF support** and **multi-code detection**!

## Features

- Single WASM file with DataMatrix and QR Code support
- Zero dependencies - pure vanilla JavaScript
- Built-in camera modal with scanning overlay
- **NEW: PDF support** - scan barcodes from PDF files
- **NEW: Multi-code detection** - find all codes in one scan
- **NEW: File upload** - drag & drop or click to upload
- Works with any framework (React, Vue, Angular, vanilla JS)
- Mobile-optimized camera handling
- Lazy-loads WASM and PDF.js only when needed

## Installation

```bash
npm install prescription-scanner
```

## Usage

### ESM / TypeScript

```typescript
import { PrescriptionScanner } from 'prescription-scanner';

const scanner = new PrescriptionScanner({
  onScan: (result) => {
    console.log('Scanned:', result.data, result.format);
  },
  // NEW: Get all results when modal closes
  onMultiScan: (results) => {
    console.log('All codes:', results);
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});

// Open scanner modal (camera + file upload)
scanner.open();

// Or create a button
scanner.createButton(document.getElementById('container'));
```

### Browser (IIFE)

```html
<script src="prescription-scanner.global.js"></script>
<script>
  const scanner = new PrescriptionScanner.PrescriptionScanner({
    onScan: (result) => {
      alert('Scanned: ' + result.data);
    }
  });
  scanner.open();
</script>
```

### Scan PDF directly

```typescript
import { processPDF, SuperScanner } from 'prescription-scanner';

const scanner = new SuperScanner();
await scanner.init();

// Process PDF file
const pages = await processPDF(pdfFile, { scale: 2 });

for (const page of pages) {
  const results = await scanner.scanImageData(page.imageData);
  console.log(`Page ${page.pageNumber}:`, results);
}
```

## Options

```typescript
interface ScannerModalOptions {
  // Text
  title?: string;              // Modal title (default: "Scanner")
  buttonText?: string;         // Button text (default: "Scan")

  // Behavior
  closeOnScan?: boolean;       // Auto-close after scan (default: false)

  // Formats to detect
  formats?: ('DataMatrix' | 'QRCode')[];

  // Callbacks
  onScan?: (result: ScanResult) => void;        // Called for each code
  onMultiScan?: (results: ScanResult[]) => void; // Called on close with all codes
  onError?: (error: Error) => void;
  onClose?: () => void;
}

interface ScanResult {
  data: string;
  format: 'DataMatrix' | 'QRCode';
  timestamp: number;
  points: { x: number; y: number }[];
}
```

## API

### `new PrescriptionScanner(options)`

Creates a new scanner instance.

### `scanner.open()`

Opens the camera modal and starts scanning. Modal has two tabs:
- **Kamera**: Live camera scanning
- **Datei/PDF**: Upload images or PDFs

### `scanner.close()`

Closes the modal and stops the camera.

### `scanner.getResults()`

Returns all scanned results so far.

### `scanner.createButton(container?)`

Creates and returns a styled button that opens the scanner.

### `scanner.destroy()`

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

WASM is lazy-loaded only when the scanner opens.
PDF.js is lazy-loaded only when processing PDFs.

## Browser Support

- Chrome 66+
- Firefox 62+
- Safari 12+
- Edge 79+

Requires WebAssembly and getUserMedia (camera) support.

## Changelog

### v1.1.0
- Added PDF support with PDF.js
- Added multi-code detection
- Added file upload UI (drag & drop)
- Added `onMultiScan` callback
- Added `getResults()` method

### v1.0.0
- Initial release

## License

MIT
