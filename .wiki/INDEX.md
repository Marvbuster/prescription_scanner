# Prescription Scanner — Wiki Index

> Auto-maintained. Regenerate with `/wiki-index` (oder `wiki ls prescription-scanner`).
> **Last updated:** 2026-05-14 | **Articles:** 9 | **Archived:** 0

---

## Architecture (3)

- [Systemüberblick — WASM-Barcode-Scanner](articles/architecture/system-overview.md) — Packaging, vier API-Eintrittspunkte, Source-Typen, Stack, Preload-Strategien
- [Klassen-Hierarchie — SuperScanner + Decoder](articles/architecture/class-hierarchy.md) — SuperScanner, CombinedDecoder, ScannerWasmDecoder, PrescriptionScanner-Wrapper
- [Modal vs. Headless — Wann was nutzen](articles/architecture/modal-vs-headless.md) — Entscheidungsbaum, Vergleichsmatrix, Migration

## API (3)

- [Simple-API — scan, scanAll, scanVideo](articles/api/simple-api.md) — Singleton, drei Funktionen, Source-Type-Erkennung
- [PrescriptionScanner — Modal-Klasse](articles/api/prescription-scanner-class.md) — Lebenszyklus, Modal-DOM, Optionen, openScanner-Helper
- [Preloading — WASM-Lade-Strategien](articles/api/preloading.md) — `'lazy' / 'idle' / 'eager' / false`, requestIdleCallback, public-Pfad

## WASM (2)

- [WASM-Build — zxing-cpp + Emscripten](articles/wasm/wasm-build.md) — Build-Pipeline, disabled Features (~550 KB Ersparnis), Embind-Bindings, Memory-Management
- [Preprocessing — Upscale, Sharpen, Binarize](articles/wasm/preprocessing.md) — `enhanceForScanning`, Bilinear-Upscale, Otsu/Adaptive, Performance

## Operations (1)

- [Build + Publish — tsup, Tests, NPM](articles/operations/build-publish.md) — Scripts, tsup-Config, Vitest, prepublishOnly, Browser-Build, License-Mix

---

## Stats

- **Total:** 9 articles (0 archived)
- **By category:** Architecture(3), API(3), WASM(2), Operations(1)
- **Sprache:** de
