---
title: "Systemüberblick — WASM-Barcode-Scanner"
created: 2026-05-14
updated: 2026-05-14
category: architecture
tags: [overview, wasm, barcode, datamatrix, qrcode]
status: current
related:
  - architecture/class-hierarchy
  - api/simple-api
  - wasm/wasm-build
code_refs:
  - src/index.ts
  - src/scanner.ts
  - src/modal.ts
---

# Systemüberblick — WASM-Barcode-Scanner

`prescription-scanner` ist eine **NPM-Library** für DataMatrix- und QR-Code-Scanning im Browser. **WASM-Modul** (~495 KB, kompiliert aus `zxing-cpp`), **Zero Runtime-Dependencies**, optionale Modal-UI oder rein programmatischer Headless-Modus.

## Pakete + Distribution

| Aspekt | Wert |
|--------|------|
| Name | `prescription-scanner` |
| Version | 1.1.6 |
| Lizenz | MIT AND Apache-2.0 (zxing-cpp Apache-2.0) |
| Bundle | ESM + CJS + Types in `dist/` |
| Browser-Build | `dist/browser/prescription-scanner.js` |
| WASM-Dateien | `dist/scanner.js` (53 KB) + `dist/scanner.wasm` (442 KB) |
| Tree-shaking | `sideEffects: false` |

## High-Level

```mermaid
flowchart LR
  USER[User-App<br/>React/Vue/Vanilla]
  MAIN["index.ts<br/>(öffentliche API)"]
  SIMPLE[simple.ts<br/>scan, scanVideo,<br/>scanAll]
  MODAL[modal.ts<br/>PrescriptionScanner<br/>UI-Klasse]
  SCANNER[scanner.ts<br/>SuperScanner]
  DECODER[decoder/<br/>CombinedDecoder]
  WASMD[ScannerWasmDecoder]
  PREPROC[preprocessing/<br/>upscale, sharpen, binarize]
  CAM[camera/<br/>getUserMedia]
  PDF[pdf/<br/>PDF.js dynamic]
  WASM[(scanner.wasm<br/>zxing-cpp Build)]

  USER --> MAIN
  MAIN --> SIMPLE
  MAIN --> MODAL
  SIMPLE --> SCANNER
  MODAL --> SCANNER
  SCANNER --> DECODER
  SCANNER --> CAM
  SCANNER --> PREPROC
  DECODER --> WASMD
  WASMD --> WASM
  MODAL --> PDF

  style WASM fill:#ffcccc,stroke:#cc0000,color:#000
  style MAIN fill:#ccffcc,stroke:#00aa00,color:#000
```

## Vier Eintrittspunkte

| API | Use-Case |
|-----|----------|
| `scan(source)` | One-Shot-Scan eines Bildes, Canvas oder ImageData |
| `scanAll(source)` | Wie `scan`, aber liefert **alle** Codes im Bild |
| `scanVideo(video, callback)` | Continuous Scanning aus `<video>` |
| `PrescriptionScanner` (`modal.ts`) | Vollständige Modal-UI mit Kamera + Datei-Upload + PDF |
| `SuperScanner` (`scanner.ts`) | Low-Level — eigene UI bauen |

Siehe [Simple-API](../api/simple-api.md) und [Prescription-Scanner-Klasse](../api/prescription-scanner-class.md).

## Drei Source-Typen

| Typ | API |
|-----|-----|
| `HTMLImageElement` | `scan(img)` |
| `HTMLCanvasElement` | `scan(canvas)` |
| `ImageData` | `scan(imageData)` |
| `<video>`-Stream | `scanVideo(video, cb)` oder über `SuperScanner.startCamera()` |
| PDF-File | `scanner.scanPDF(file)` (Modal-Klasse oder direkt) |

## Tech-Stack

| Schicht | Stack |
|---------|-------|
| Build | tsup (esbuild) |
| Tests | Vitest + jsdom |
| WASM-Build | Emscripten + CMake + zxing-cpp |
| PDF | PDF.js (dynamisch von CDN geladen) |
| Demo | Next.js (separates Sub-Projekt `demo/`) |

## Preload-Strategien

WASM ist ~495 KB. Vier Lade-Strategien (für `PrescriptionScanner`-Klasse):

| Strategie | Wann |
|-----------|------|
| `'lazy'` | beim ersten Scan (Default) |
| `'idle'` | beim nächsten `requestIdleCallback` |
| `'eager'` | sofort beim Konstruktor |
| `false` | manuell via `scanner.preload()` |

Wichtig fürs **Pharmacy-UX**: User klickt Button → Scanner soll bereit sein → `'idle'` empfohlen.

Details: [Preloading](../api/preloading.md).

## Nicht-Ziele

- **Kein 1D-Barcode** (EAN, UPC). zxing-cpp ist konfigurierbar, aber unsere Build-Config hat `ZXING_ENABLE_1D=OFF`.
- **Kein Server-Side-Scanning** — Browser-only.
- **Kein Framework-Wrapper** (React-Hooks etc.) — die Lib ist absichtlich Framework-agnostisch.
- **Keine Cloud-Integration** — nicht das Tool für Server-OCR.

## Verwandte Artikel

- [Klassen-Hierarchie](class-hierarchy.md)
- [Simple-API](../api/simple-api.md)
- [WASM-Build](../wasm/wasm-build.md)
- [Modal-vs-Headless](modal-vs-headless.md)
