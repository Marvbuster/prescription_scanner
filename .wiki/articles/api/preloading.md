---
title: "Preloading — WASM-Lade-Strategien"
created: 2026-05-14
updated: 2026-05-14
category: api
tags: [preload, wasm, performance, ux]
status: current
related:
  - api/prescription-scanner-class
  - architecture/system-overview
code_refs:
  - src/modal.ts
  - src/decoder/scanner-wasm.ts
---

# Preloading — WASM-Lade-Strategien

Das WASM-Modul ist ~495 KB (komprimiert ~200 KB). Auf langsamen Verbindungen merkbar — die `preload`-Option steuert, **wann** der Download startet.

## Vier Strategien

| Strategie | Wann gestartet | UX-Effekt |
|-----------|----------------|-----------|
| `'lazy'` (default) | beim ersten Scan | Initial-Bundle klein, erster Scan hat WASM-Latenz |
| `'idle'` | bei `requestIdleCallback` (oder 1s-Fallback) | Optimal: WASM lädt nebenher, erster Scan ist sofort bereit |
| `'eager'` | sofort beim `new PrescriptionScanner()` | WASM beginnt zu laden, blockiert nicht — Konstruktor returnt sofort |
| `false` | nie automatisch — manuell via `scanner.preload()` oder `init()` | volle Kontrolle, für komplexe Lazy-Pattern |

## Empfehlung pro Use-Case

| Use-Case | Empfehlung |
|----------|------------|
| Scanner ist Haupt-Feature der Seite | `'eager'` — User wartet eh kurz auf den Page-Load |
| Scanner ist sekundär (Button im Header) | `'idle'` — lade nebenher, kein Bundle-Block |
| Scanner kommt nur bei Tiefen-Navigation | `'lazy'` — keine Verschwendung |
| Du brauchst exakte Kontrolle (z.B. Network-Aware) | `false` + eigener Trigger |

## `'idle'`-Implementierung

```ts
if (window.requestIdleCallback) {
  requestIdleCallback(() => this.preload());
} else {
  setTimeout(() => this.preload(), 1000);  // Fallback für Safari < 17
}
```

Browser-API `requestIdleCallback` lädt nur, wenn der Main-Thread idle ist. Safari < 17 hatte das lang nicht, daher der 1s-Fallback.

## `'eager'`-Implementierung

```ts
constructor(options) {
  // ... setup ...
  if (this.options.preload === 'eager') {
    this.preload();  // fire-and-forget, kein await
  }
}
```

Konstruktor returnt sofort, WASM lädt im Hintergrund. Bei erster Scan-Operation wartet die Lib auf das laufende Load-Promise.

## `false`-Strategie

```ts
const scanner = new PrescriptionScanner({ preload: false });
// ... User-Interaction ...
button.addEventListener('click', async () => {
  await scanner.preload();  // erst hier laden
  await scanner.open();
});
```

Für absolute Kontrolle. Du kannst z.B. nur bei Wi-Fi laden:

```ts
if (navigator.connection?.effectiveType === '4g' || navigator.connection?.type === 'wifi') {
  await scanner.preload();
}
```

## Bundle-Größe-Beitrag

| Strategie | Effekt auf Bundle | Effekt auf Network |
|-----------|-------------------|---------------------|
| WASM-Lib | ~5 KB JS | ~495 KB WASM beim Load |
| Modal-UI | ~20 KB CSS+JS (im Modal-Modus) | – |
| PDF.js | 0 KB initial, ~300 KB beim ersten PDF | (CDN) |

Total `dist/`:

| Datei | Größe (gzip) |
|-------|--------------|
| `index.js` | ~50 KB |
| `scanner.js` | ~53 KB (WASM-Loader) |
| `scanner.wasm` | ~442 KB |

## `onReady`-Callback

Sobald WASM geladen ist, feuert `onReady`:

```ts
const scanner = new PrescriptionScanner({
  preload: 'idle',
  onReady: () => {
    scanButton.disabled = false;
    scanButton.textContent = 'Bereit zum Scannen';
  },
});

scanButton.textContent = 'Lade...';
scanButton.disabled = true;
```

Saubere UX — User sieht, wann der Scanner einsatzbereit ist.

## WASM-Files im Public-Pfad

Damit der Loader die Files findet, müssen `scanner.js` + `scanner.wasm` ausgeliefert werden. **Default-Pfad**: `/wasm/`.

```bash
# Nach npm install:
cp node_modules/prescription-scanner/dist/scanner.js public/wasm/
cp node_modules/prescription-scanner/dist/scanner.wasm public/wasm/
```

Bei Next.js: in `public/wasm/`. Bei Vite: in `public/wasm/`. Bei CRA: in `public/wasm/`.

Custom-Pfad:

```ts
const scanner = new PrescriptionScanner({ wasmBasePath: '/static/wasm/' });
```

## Edge Cases

| Fall | Verhalten |
|------|-----------|
| `scanner.js` 404 | Error im Console + `onError`-Callback |
| `scanner.wasm` 404 | gleich — Loader meldet „WASM loader not found" |
| Mehrere `PrescriptionScanner`-Instanzen | jede lädt **ihren eigenen** Module-Singleton (innerhalb der Instanz cached) |
| `requestIdleCallback` nicht da | 1s-`setTimeout`-Fallback greift |
| Browser-Tab im Background bei `'idle'` | `requestIdleCallback` feuert evtl. erst beim Re-Focus |

## Verwandte Artikel

- [Prescription-Scanner-Klasse](prescription-scanner-class.md)
- [WASM-Build](../wasm/wasm-build.md)
- [System-Overview](../architecture/system-overview.md)
