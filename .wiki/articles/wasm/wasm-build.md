---
title: "WASM-Build — zxing-cpp + Emscripten"
created: 2026-05-14
updated: 2026-05-14
category: wasm
tags: [wasm, build, emscripten, zxing]
status: current
related:
  - wasm/preprocessing
  - architecture/class-hierarchy
code_refs:
  - wasm/build.sh
  - src/decoder/scanner-wasm.ts
---

# WASM-Build — `zxing-cpp` + Emscripten

Der eigentliche Barcode-Decoder ist ein **eigenes WASM-Modul** mit nur DataMatrix + QR Code aus `zxing-cpp`. Reduziert die Bundle-Size auf ~495 KB statt der typischen ~2 MB einer full-feature zxing-wasm-Distribution.

## Build-Pipeline

```mermaid
flowchart LR
  ZXING[zxing-cpp<br/>Repo Clone<br/>commit fba4e950]
  CMAKE[emcmake cmake<br/>--config MinSizeRel<br/>--ZXING_ENABLE_DATAMATRIX=ON<br/>--ZXING_ENABLE_QRCODE=ON<br/>(alle anderen OFF)]
  BUILD[cmake --build]
  BIND[Custom JS-Bindings<br/>EMBIND_BINDINGS]
  WASM[scanner.wasm<br/>~442 KB]
  JS[scanner.js<br/>~53 KB Loader]

  ZXING --> CMAKE --> BUILD --> BIND --> WASM
  BIND --> JS

  style WASM fill:#ffcccc,stroke:#cc0000,color:#000
```

`wasm/build.sh`:

```bash
emcmake cmake "$ZXING_DIR" \
  -DCMAKE_BUILD_TYPE=MinSizeRel \
  -DBUILD_SHARED_LIBS=OFF \
  -DZXING_READERS=ON \
  -DZXING_WRITERS=OFF \
  -DZXING_ENABLE_1D=OFF \
  -DZXING_ENABLE_AZTEC=OFF \
  -DZXING_ENABLE_DATAMATRIX=ON \
  -DZXING_ENABLE_MAXICODE=OFF \
  -DZXING_ENABLE_PDF417=OFF \
  -DZXING_ENABLE_QRCODE=ON \
  -DZXING_C_API=OFF \
  -DZXING_UNIT_TESTS=OFF \
  -DZXING_EXAMPLES=OFF

cmake --build . --config MinSizeRel -j$(sysctl -n hw.ncpu)
```

Disabled Features eliminieren Code:

| Feature | Status | Effekt |
|---------|:---:|---|
| 1D (EAN, UPC, Code39, …) | OFF | ~200 KB gespart |
| Aztec | OFF | ~80 KB |
| MaxiCode | OFF | ~50 KB |
| PDF417 | OFF | ~120 KB |
| Writers | OFF | ~100 KB |
| C-API | OFF | – (intern) |

## Pinned Commit

```bash
git clone https://github.com/zxing-cpp/zxing-cpp.git
git checkout fba4e9503fee4518ca2e89510baeea9bcc36dc8d
```

Pinned auf einen spezifischen Commit, weil zxing-cpp regelmäßig Breaking-Changes hat. Update erfordert vorsichtiges Re-Test.

## JS-Bindings (Embind)

Nach dem C++-Build wird ein Custom-Wrapper kompiliert, der die `scan()`-Funktion exposed:

```cpp
emscripten::function("scan", &scan_rgba_pixels);
emscripten::value_object<WasmResult>("WasmResult")
  .field("text", &WasmResult::text)
  .field("format", &WasmResult::format)
  .field("error", &WasmResult::error)
  .field("x0", &WasmResult::x0)
  // ... weitere x1-y3 Position-Fields
;
emscripten::register_vector<WasmResult>("ResultVector");
```

Output: `scanner.js` (Loader) + `scanner.wasm` (Binär).

## Call von JS aus

`src/decoder/scanner-wasm.ts`:

```ts
const ptr = this.module._malloc(rgba.length);
this.module.HEAPU8.set(rgba, ptr);
const results = this.module.scan(ptr, width, height);
this.module._free(ptr);

const decoded = [];
for (let i = 0; i < results.size(); i++) {
  const r = results.get(i);
  if (r.error) continue;
  decoded.push({
    data: r.text,
    format: FORMAT_MAP[r.format] || r.format,
    position: {
      topLeft:     { x: r.x0, y: r.y0 },
      topRight:    { x: r.x1, y: r.y1 },
      bottomRight: { x: r.x2, y: r.y2 },
      bottomLeft:  { x: r.x3, y: r.y3 },
    },
  });
}
results.delete();
return decoded;
```

**Memory-Management** ist explizit:

- `_malloc(rgba.length)` → Pointer in WASM-Heap
- `HEAPU8.set(rgba, ptr)` → RGBA-Bytes ins Heap kopieren
- `scan(ptr, w, h)` → C++-Code arbeitet
- `_free(ptr)` → Memory freigeben
- `results.delete()` → Embind-Vector freigeben

Wenn man `_free` oder `delete` vergisst → Memory-Leak, der über die Zeit das Tab unbrauchbar macht (wichtig für continuous scanning).

## Vorteile gegenüber zxing-wasm

| Aspekt | prescription-scanner | offizielles zxing-wasm |
|--------|----------------------|------------------------|
| Größe | 495 KB | ~2 MB |
| Formate | DataMatrix + QR | alle (1D, 2D) |
| Speed | gleich (gleicher Core) | gleich |
| Pinned-Build | ja, kontrolliert | ja, aber meist neueste |
| Custom-Bindings | unsere | offizielle |

Für Pharmacy-Use-Case (Rezept-Codes = DataMatrix oder QR) brauchen wir die 1D-Codes nicht.

## Rebuild-Anleitung

```bash
# Voraussetzungen: Emscripten SDK installiert
brew install cmake
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk && ./emsdk install latest && ./emsdk activate latest
source ./emsdk_env.sh

# Build
cd /Users/.../prescription-scanner/wasm
./build.sh
# Output: scanner.js, scanner.wasm

# Library-Build
cd ..
npm run build
```

## Edge Cases

| Fall | Verhalten |
|------|-----------|
| Image > WASM-Memory-Limit (8 GB Default für JS-WASM) | Crash beim `_malloc` |
| Korrupte WASM-File (Partial Download) | Loader meldet „Invalid WASM module" |
| Mehrere `scan()`-Calls parallel | Serialisiert intern durch WASM-Module |
| CSP-Strict mit `wasm-unsafe-eval` blockiert | WASM-Loader bricht — Site-CSP muss WASM-Eval erlauben |

## Verwandte Artikel

- [Preprocessing](preprocessing.md)
- [Klassen-Hierarchie](../architecture/class-hierarchy.md)
