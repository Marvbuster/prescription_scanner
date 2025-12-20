# Prescription Scanner

Lightweight WASM barcode scanner for web applications. Supports **DataMatrix** and **QR Code**.

**~495 KB total** (53 KB JS + 442 KB WASM)

## Features

- Single WASM file with DataMatrix and QR Code support
- Zero dependencies - pure vanilla JavaScript
- Built-in camera modal with scanning overlay
- Works with any framework (React, Vue, Angular, vanilla JS)
- Mobile-optimized camera handling
- Lazy-loads WASM only when scanner opens

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
  onError: (error) => {
    console.error('Error:', error);
  }
});

// Open scanner modal
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

## Options

```typescript
interface ScannerOptions {
  // Text
  title?: string;              // Modal title (default: "Scanner")
  buttonText?: string;         // Button text (default: "Scan")

  // Behavior
  closeOnScan?: boolean;       // Auto-close after scan (default: true)

  // Formats to detect
  formats?: ('DataMatrix' | 'QRCode')[];

  // Callbacks
  onScan?: (result: ScanResult) => void;
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

Opens the camera modal and starts scanning.

### `scanner.close()`

Closes the modal and stops the camera.

### `scanner.createButton(container?)`

Creates and returns a styled button that opens the scanner. Optionally appends to container.

### `scanner.destroy()`

Cleanup - stops camera and removes event listeners.

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

This compiles zxing-cpp to WebAssembly with only DataMatrix and QR Code.

## Bundle Size

| File | Size |
|------|------|
| scanner.wasm | 442 KB |
| scanner.js | 53 KB |
| index.js (ESM) | 18 KB |
| **Total** | **~495 KB** |

WASM is lazy-loaded only when the scanner opens.

## Browser Support

- Chrome 66+
- Firefox 62+
- Safari 12+
- Edge 79+

Requires WebAssembly and getUserMedia (camera) support.

## License

MIT
