---
project_name: "Prescription Scanner — WASM-Barcode-Lib"
wiki_root: ".wiki"
article_dir: "articles"
inbox_dir: "_inbox"
archive_dir: "_archive"
default_language: "de"
auto_index: true
auto_crosslink: true
categories:
  - architecture
  - api
  - wasm
  - operations
tech_stack:
  - nextjs
  - react
  - tailwind
  - typescript
  - vitest

---

# Wiki Configuration

**npm-Package** `prescription-scanner` (v1.1.6) — leichtgewichtiger WASM-Barcode-Scanner für Web-Anwendungen. Unterstützt **DataMatrix** und **QR Code** über ein eigenes WebAssembly-Modul (~495 KB), basierend auf `zxing-cpp`. Zero Dependencies, optionale UI (Modal) oder Headless-API, PDF-Support via PDF.js (lazy via CDN), Multi-Code-Detection, Image-Enhancement (Upscaling, Schärfen, Kontrast).

## Categories

| Category | Scope |
|----------|-------|
| `architecture` | Klassen-Aufbau (SuperScanner, CombinedDecoder, ScannerWasmDecoder), Modal-vs-Headless, Preload-Strategien |
| `api` | Public-API (Simple-Funktionen, PrescriptionScanner-Klasse, Optionen, Events) |
| `wasm` | WASM-Build (zxing-cpp + Emscripten), JS-Bindings, Preprocessing-Filter, PDF-Pipeline |
| `operations` | NPM-Publishing, Build mit tsup, Vitest-Tests, Demo-App |

## Code Roots

- Source: `src/` (Main-API + Submodule)
- WASM-Build: `wasm/build.sh` (zxing-cpp + Emscripten)
- Tests: `tests/` (vitest)
- Demo-App: `demo/` (Next.js)
- Build-Tooling: `tsup.config.ts`, `vitest.config.ts`

## Conventions

- Sprache: Deutsch
- TypeScript-only, `dist/` enthält ESM + CJS + Types
- WASM-Dateien (`scanner.js`, `scanner.wasm`) müssen im public-Pfad der Host-App liegen

## Article Lifecycle

| Status | Bedeutung |
|--------|-----------|
| `current` | Aktiv und aktuell |
| `draft` | In Arbeit |
| `stale` | Braucht Review |
| `archived` | Veraltet, in `_archive/` verschoben |
