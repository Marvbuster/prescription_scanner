---
title: "Simple-API — scan, scanAll, scanVideo"
created: 2026-05-14
updated: 2026-05-14
category: api
tags: [api, simple, scan, video]
status: current
related:
  - api/prescription-scanner-class
  - architecture/modal-vs-headless
code_refs:
  - src/simple.ts
---

# Simple-API — `scan`, `scanAll`, `scanVideo`

Minimalistische, **funktion-basierte** API für quick wins. Singleton-Scanner intern, alle Calls teilen sich denselben WASM-Load. Ohne UI, ohne Klassen-Instanziierung.

## Drei Funktionen

```ts
import { scan, scanAll, scanVideo } from 'prescription-scanner';
```

| Funktion | Input | Output |
|----------|-------|--------|
| `scan(source)` | Image, Canvas, ImageData | `ScanResult \| null` (erstes Match) |
| `scanAll(source)` | Image, Canvas, ImageData | `ScanResult[]` (alle Matches) |
| `scanVideo(video, cb)` | `<video>` + Callback | `() => void` (Stop-Function) |

## `ScanResult`-Typ

```ts
interface ScanResult {
  data: string;                            // dekodierte Payload
  format: 'DataMatrix' | 'QRCode';
  position?: {                              // Code-Position im Bild (optional)
    topLeft: Point;
    topRight: Point;
    bottomRight: Point;
    bottomLeft: Point;
  };
}
```

## `scan(source)` — Single Match

```ts
const result = await scan(imageElement);
if (result) {
  console.log(result.data, result.format);
}
```

Findet **den ersten** Code im Bild. Reicht für Rezept-Codes, die i.d.R. nur einen Code pro Foto enthalten.

Internal:

```ts
const scanner = await getScanner();   // Singleton-Init
const results = await scanner.scanImage(source);
return results[0] || null;
```

## `scanAll(source)` — Multi-Code

```ts
const results = await scanAll(imageElement);
results.forEach(r => console.log(r.data));
```

Liefert alle gefundenen Codes. Useful für **Multi-Rezept-Scan** (ein Foto, mehrere Codes nebeneinander).

## `scanVideo(video, callback)` — Continuous

```ts
const videoEl = document.querySelector('video');
const stop = await scanVideo(videoEl, (result) => {
  console.log('Scanned:', result.data);
  stop();  // nach erstem Hit anhalten (optional)
});

// Manuell stoppen:
setTimeout(stop, 10000);  // 10s Timeout
```

Internal: nutzt `SuperScanner.startCamera()`+`scanner.on('scan', cb)`, gibt die Stop-Funktion zurück.

⚠️ Die Funktion expectet einen **bereits aktiven `<video>`-Stream**. Wenn die Kamera noch nicht läuft, muss man entweder die Modal-Klasse oder `startCamera()` direkt nutzen.

## Singleton-Caching

```ts
let sharedScanner: SuperScanner | null = null;

async function getScanner() {
  if (!sharedScanner) {
    sharedScanner = new SuperScanner({ formats: ['DataMatrix', 'QRCode'] });
    await sharedScanner.init();
  }
  return sharedScanner;
}
```

→ Nur **ein WASM-Load** pro Page-Load, auch bei vielen `scan()`-Aufrufen.

## `cleanup()` — Manuell freigeben

```ts
import { cleanup } from 'prescription-scanner';
cleanup();  // entfernt Singleton, nächster scan() lädt WASM neu
```

Selten gebraucht — nur wenn man WASM-Memory explizit freimachen will (z.B. nach langem Scan-Burst).

## `startScanner()` — Vor-Initialisierung

```ts
import { startScanner } from 'prescription-scanner';

// In App-Initialisierung:
await startScanner();

// Später: scan() ist sofort bereit
const result = await scan(img);
```

Nutzbar, um den WASM-Load aus dem ersten User-Interaction zu nehmen.

## Type-Guard für Source

```ts
if (source instanceof HTMLImageElement) {
  results = await scanner.scanImage(source);
} else if (source instanceof HTMLCanvasElement) {
  results = await scanner.scanCanvas(source);
} else {
  results = await scanner.scanImageData(source);
}
```

Drei Source-Typen werden automatisch erkannt. SSR-Hinweis: `instanceof HTMLImageElement` würde auf dem Server fehlschlagen — Lib ist Browser-only.

## Edge Cases

| Fall | Verhalten |
|------|-----------|
| Bild ohne Code | `scan` returnt `null`, `scanAll` returnt `[]` |
| Bild mit beschädigtem Code | `null`/`[]` — kein Error |
| Quer ausgerichteter Code | WASM dreht und erkennt — keine zusätzliche Pre-Rotation nötig |
| Sehr kleines Bild | wird intern via `enhanceForScanning` upscaled |
| `scanVideo` ohne `srcObject` | meist `null`-Results, kein Error |
| Mehrfach `scan()` parallel | gleicher Singleton, sequenziell durch WASM-Module (intern atomic) |

## Verwandte Artikel

- [Prescription-Scanner-Klasse](prescription-scanner-class.md) — die Vollausführung mit UI
- [Preloading](preloading.md) — WASM-Strategien
- [Modal vs. Headless](../architecture/modal-vs-headless.md)
