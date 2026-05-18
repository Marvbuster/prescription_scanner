---
title: "Build + Publish — tsup, Tests, NPM"
created: 2026-05-14
updated: 2026-05-14
category: operations
tags: [build, tsup, npm, vitest, publish]
status: current
related:
  - wasm/wasm-build
code_refs:
  - tsup.config.ts
  - vitest.config.ts
  - package.json
---

# Build + Publish — tsup, Tests, NPM

Standard-Library-Setup: **tsup** (esbuild-Wrapper) für den Build, **vitest** für Tests, **`prepublishOnly`-Hook** für NPM-Release.

## Scripts (`package.json`)

| Script | Wirkung |
|--------|---------|
| `npm run build` | `tsup && cp wasm/scanner.js wasm/scanner.wasm dist/` |
| `npm run build:prod` | `tsup --no-sourcemap && cp ...` |
| `npm run dev` | `tsup --watch` |
| `npm run build:wasm` | `./wasm/build.sh` (Emscripten-Build, langsam) |
| `npm test` | `vitest run` |
| `npm run test:watch` | `vitest` (interactive) |
| `prepublishOnly` | automatisch vor `npm publish` — baut Prod-Variante |

## tsup-Config

Output:

```
dist/
├── index.js          # ESM-Build
├── index.cjs         # CommonJS-Build
├── index.d.ts        # TypeScript-Types
├── scanner.js        # WASM-Loader (kopiert)
├── scanner.wasm      # WASM-Binary (kopiert)
└── browser/          # Standalone IIFE-Build (optional)
```

Entry-Points: aus `package.json::exports`:

```json
{
  ".":      { "import": "./dist/index.js", "require": "./dist/index.cjs", "types": "./dist/index.d.ts" },
  "./wasm": { "import": "./dist/scanner.js", "default": "./dist/scanner.js" }
}
```

## Vitest

`vitest.config.ts` mit jsdom-Environment für Browser-API-Mocks:

```ts
test: { environment: 'jsdom' }
```

Tests unter `tests/`:

| Datei | Scope |
|-------|-------|
| `scanner.test.ts` | `SuperScanner`-Klasse |
| `integration.test.ts` | End-to-End mit fake-WASM-Mock |
| `pdf.test.ts` | PDF-Pipeline |
| `preprocessing.test.ts` | Filter-Funktionen |
| `types.test.ts` | Type-Definitions (Compile-Tests) |

```bash
npm test
# vitest run → alle Tests einmal
```

## NPM Publish

```bash
npm version patch       # 1.1.6 → 1.1.7
git push --tags
npm publish             # → prepublishOnly läuft build:prod
```

`prepublishOnly`-Hook macht den Prod-Build (ohne Sourcemaps) automatisch.

## `files` im package.json

```json
"files": [
  "dist",
  "LICENSE",
  "THIRD-PARTY-NOTICES"
]
```

Was im NPM-Tarball landet. `src/`, `tests/`, `wasm/` werden ausgespart — User braucht nur `dist/`.

## Browser-Build

`<dist/browser/prescription-scanner.js>` (Build-Output, gitignored) — IIFE-Bundle für `<script>`-Einbindung ohne Bundler:

```html
<script src="https://unpkg.com/prescription-scanner/dist/browser/prescription-scanner.js"></script>
<script>
  const scanner = new PrescriptionScanner.PrescriptionScanner({ ... });
</script>
```

(Global namespace: `PrescriptionScanner`.)

## License-Mix

`license: "MIT AND Apache-2.0"`:

- Eigener Code: MIT.
- zxing-cpp im WASM-Binary: Apache-2.0.
- `THIRD-PARTY-NOTICES` listet die zxing-cpp-Lizenz auf.

NPM zeigt im UI „MIT and Apache-2.0" — bei der Integration in Apps muss man beide einhalten (i.d.R. einfache Attribution).

## Demo-App

`demo/` ist ein **separates Next.js-Projekt** mit eigener `package.json`. Eingebaut, um die Library lokal zu testen:

```bash
cd demo
npm install
npm run dev
```

Dev-Server zeigt mehrere Scan-Szenarien (Kamera, Datei-Upload, PDF, scanBounds).

## Build-Performance

| Build | Dauer |
|-------|-------|
| `npm run build` (tsup) | ~3 s |
| `npm run build:wasm` (zxing-cpp komplett neu) | ~3–5 min |
| `npm test` | ~5 s |

WASM-Build ist die teure Sache — meist macht man `build:wasm` nur, wenn man die WASM-Config ändert. Sonst sind die bereits gebauten `scanner.js`/`scanner.wasm` im `wasm/`-Ordner ausreichend.

## Edge Cases

| Fall | Verhalten |
|------|-----------|
| `tsup` failed wegen TS-Error | Build bricht, NPM-Publish wird durch `prepublishOnly` ebenfalls blockiert |
| `wasm/scanner.wasm` fehlt | `cp`-Command failed im build-Script → Build bricht |
| Tests schlagen fehl | `prepublishOnly` läuft NUR Build, kein `npm test` davor — manuell ausführen vor Publish |
| `npm publish` ohne `npm login` | NPM meldet 401 |
| Lock-File-Mismatch | `npm ci` reicht im CI, lokal `npm install` |

## Verwandte Artikel

- [WASM-Build](../wasm/wasm-build.md)
- [Klassen-Hierarchie](../architecture/class-hierarchy.md)
