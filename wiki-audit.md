# Prescription Scanner — WASM-Barcode-Lib (prescription-scanner)
_Audit Wiki vs Code · 9 Artikel · 13 Funde · Severity: 0c/4h/5m/4l_

## Zusammenfassung
Das Wiki deckt Architektur, Preload-Strategien und den WASM-Build gut ab und ist nach vier Audit-Runden an den Datei-/Zeilenreferenzen weitgehend sauber. Es klemmt dort, wo der Code vom dokumentierten Ideal abweicht: die Modal-Klasse wendet entgegen dem Wiki standardmäßig `enhanceForScanning` (2.5x Upscale) an, der Embind-Vector wird nie freigegeben (das Wiki beschreibt den `delete()`-Call als vorhanden), der `ScanResult`-Typ und die Decoder-Signatur sind veraltet dokumentiert, und zwei Optionen (`headless`, `preprocessing`) sind im Code tote Flags, die das Wiki als wirksam beschreibt. Dazu kommt ein falscher Browser-Build-Pfad, der auch im `package.json`-`browser`-Feld steht.

## Funde
### [HIGH] Browser-Build heißt `prescription-scanner.global.js`, nicht `prescription-scanner.js`  — stale
- **Artikel/Datei:** operations/build-publish, architecture/system-overview, `package.json`
- **Problem:** Wiki und `package.json` nennen `dist/browser/prescription-scanner.js` (inkl. unpkg-Snippet). tsup erzeugt für IIFE `prescription-scanner.global.js`. Der unpkg-Link im Wiki liefert 404, das `browser`-Feld im Package zeigt ins Leere. Außerdem behauptet das Wiki, der Browser-Build sei „gitignored" — `dist/` ist komplett getrackt.
- **Beleg:** Wiki build-publish: „`<script src="https://unpkg.com/prescription-scanner/dist/browser/prescription-scanner.js">`" und „(Build-Output, gitignored)". Code: `git ls-files dist` → `dist/browser/prescription-scanner.global.js`; `package.json:10` `"browser": "dist/browser/prescription-scanner.js"`; `.gitignore` enthält kein `dist`; `README.md:132` nutzt korrekt `prescription-scanner.global.js`.

### [HIGH] `startScanner()` als „Vor-Initialisierung" dokumentiert — startet in Wahrheit die Kamera  — stale
- **Artikel/Datei:** api/simple-api (Abschnitt „`startScanner()` — Vor-Initialisierung")
- **Problem:** Das Wiki empfiehlt `await startScanner();` ohne Argumente in der App-Initialisierung, um den WASM-Load vorzuziehen. Die Funktion verlangt einen `onScan`-Callback, erzeugt ein `<video>` und ruft `scanVideo` → `scanner.start()` → `getUserMedia` auf. Wer dem Snippet folgt, löst beim App-Start einen Kamera-Permission-Prompt aus und registriert `undefined` als Scan-Handler. Derselbe Artikel beschreibt die Funktion drei Absätze vorher korrekt („legt das Element selbst an") — der Artikel widerspricht sich selbst.
- **Beleg:** Wiki: „`await startScanner(); // In App-Initialisierung … Später: scan() ist sofort bereit`". Code `src/simple.ts:140-159`: `export async function startScanner(onScan, options?)` … `const video = document.createElement('video')` … `const stop = await scanVideo(video, onScan, options)`; `src/scanner.ts:186` `this.camera = await startCamera(videoElement, …)`.

### [HIGH] Modal-Klasse wendet standardmäßig `enhanceForScanning` (2.5x Upscale) an — Wiki sagt „kein Preprocessing"  — contradiction
- **Artikel/Datei:** wasm/preprocessing („Default-Verhalten"), api/prescription-scanner-class („Static-Scan-Methoden … identisch zu denen auf SuperScanner")
- **Problem:** `PrescriptionScanner.scanImageData`, `scanPDF` und der Datei-Upload-Pfad im Modal rufen immer `enhanceForScanning(imageData)` mit Defaults (Upscale 2.5 → 6.25x Pixel, Brightness 1.1, Contrast 1.3) auf; `scanImage`/`scanCanvas` dagegen nicht. Das Wiki warnt selbst vor 100 MB bei 4 MP — genau das passiert jetzt bei jedem Foto-Upload im Modal, ohne dass es dokumentiert oder abschaltbar ist.
- **Beleg:** Wiki preprocessing: „Beim Standard-Scan **wird kein Preprocessing angewendet**. Der WASM-Decoder bekommt direkt das Roh-RGBA." Code `src/modal.ts:440` `const enhanced = enhanceForScanning(imageData);`, `:461`, `:861`, `:868`; `src/preprocessing/enhance.ts:141` `upscaleFactor = 2.5`, `:9` `scale: number = 2.5`.

### [HIGH] Embind-Result-Vector wird nie freigegeben — Wiki dokumentiert `results.delete()` als vorhanden  — code-smell
- **Artikel/Datei:** wasm/wasm-build („Call von JS aus", „Memory-Management"), `src/decoder/scanner-wasm.ts`
- **Problem:** Das Wiki zeigt `results.delete()` im Decode-Code und warnt: „Wenn man `_free` oder `delete` vergisst → Memory-Leak … (wichtig für continuous scanning)". Der echte Decoder ruft `delete()` nie auf; das `EmbindVector`-Interface kennt die Methode nicht einmal. Im 10-fps-Scan-Loop leakt pro Frame ein Embind-Vector. Der Wiki-Snippet weicht auch sonst ab (`position: {topLeft…}` statt `points`, `if (r.error) continue`, `FORMAT_MAP[r.format] || r.format`).
- **Beleg:** Wiki: „`results.delete(); return decoded;`" und „`results.delete()` → Embind-Vector freigeben". Code `src/decoder/scanner-wasm.ts:18-21` `interface EmbindVector<T> { size(); get(); }` (kein `delete`), `:98-120` `const resultVector = this.module.scan(…)` … `return decoded;` ohne `delete()`.

### [MEDIUM] `ScanResult`-Typ und Decoder-Signatur veraltet dokumentiert  — stale
- **Artikel/Datei:** api/simple-api („`ScanResult`-Typ"), architecture/class-hierarchy (Klassendiagramm, „Decode-Call")
- **Problem:** Wiki definiert `position?: { topLeft, topRight, bottomRight, bottomLeft }` und kein `timestamp`. Der echte Typ hat `points?: Point[]`, `rawBytes?`, `timestamp: number`. Consumer-Code nach Wiki (`result.position.topLeft`) ist `undefined`. Zudem dokumentiert class-hierarchy `decode(rgba, w, h)`, real ist `decode(imageData: ImageData, formats)`.
- **Beleg:** Wiki simple-api: „`position?: { topLeft: Point; … }`". Code `src/types.ts:9-20` `points?: Point[]; rawBytes?: Uint8Array; timestamp: number;`; `src/decoder/scanner-wasm.ts:90` `async decode(imageData: ImageData, formats: BarcodeFormat[])`; `src/decoder/index.ts:27-30`.

### [MEDIUM] `headless`-Option wird im Code nie ausgewertet — `open()` startet die Kamera immer  — stale
- **Artikel/Datei:** api/prescription-scanner-class („`open()` … startet Kamera (wenn `headless=false`)"), `src/modal.ts`
- **Problem:** `headless` wird nur im Options-Typ deklariert und im Konstruktor gespeichert, danach nirgends gelesen. `open()` → `startScanner()` ruft unabhängig davon `getUserMedia` auf. Die Wiki-Aussage zur Kamera-Bedingung ist falsch; `tests/scanner.test.ts:37` testet ein wirkungsloses Flag.
- **Beleg:** `grep -n headless src/modal.ts` → nur `:19` (Typ) und `:343` (`headless: options.headless ?? true`). `src/modal.ts:582-587` `open()` → `await this.startScanner()`; `:970-976` `this.stream = await navigator.mediaDevices.getUserMedia({…})`.

### [MEDIUM] `preprocessing`-Option auf `SuperScanner` ist ein totes Flag  — code-smell
- **Artikel/Datei:** architecture/class-hierarchy (Konstruktor-Beispiel `preprocessing: { binarize: 'none', sharpen: false, invert: false }`), `src/scanner.ts`
- **Problem:** Die Option wird in Defaults gemerged und per `setOptions` aktualisiert, aber `preprocess()` wird außerhalb des Preprocessing-Moduls nie aufgerufen. `binarize: 'otsu'` o. ä. hat keinerlei Wirkung — das Wiki präsentiert sie als wirksame Konfiguration.
- **Beleg:** `src/scanner.ts:10` `// Preprocessing not needed - WASM handles RGBA directly`; `:38-51` Defaults, `:388-394` `setOptions` merged `preprocessing`; `:245-252` `processFrame` dekodiert direkt; `grep -rn 'preprocess(' src/scanner.ts src/modal.ts src/simple.ts` → keine Treffer.

### [MEDIUM] Modal öffnet die Kamera doppelt und ignoriert `camera`-Optionen  — code-smell
- **Artikel/Datei:** `src/modal.ts` (nicht im Wiki beschrieben: api/prescription-scanner-class, architecture/class-hierarchy)
- **Problem:** `startScanner()` holt selbst einen Stream per `getUserMedia` und hängt ihn ans Video, ruft dann `scanner.start(this.video)`, das in `startCamera()` einen zweiten Stream öffnet und `srcObject` überschreibt. Zwei Kamera-Streams laufen parallel, der erste bleibt bis `stopScanner()` verwaist offen (Kamera-LED, Akku, iOS-Konflikte). `facingMode`/Auflösung sind hartcodiert, `ScannerOptions.camera` wird im Modal nicht durchgereicht.
- **Beleg:** `src/modal.ts:970-979` `this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', … } }); this.video.srcObject = this.stream; … await this.scanner.start(this.video);` → `src/scanner.ts:186` `startCamera(videoElement, …)` → `src/camera/index.ts:33-34` `const stream = await navigator.mediaDevices.getUserMedia(constraints); videoElement.srcObject = stream;`.

### [MEDIUM] `scanner.scanner?.setOptions(...)` greift auf ein `private`-Feld zu  — stale
- **Artikel/Datei:** api/prescription-scanner-class („`setOptions(opts)` — nur auf `SuperScanner`")
- **Problem:** Der dokumentierte Zugriffsweg kompiliert in TypeScript nicht (TS2341, Property 'scanner' is private). Es gibt keinen öffentlichen Weg zu `setOptions` über die Modal-Klasse.
- **Beleg:** Wiki: „`scanner.scanner?.setOptions({ formats: ['QRCode'] });`". Code `src/modal.ts:329` `private scanner: SuperScanner | null = null;`.

### [LOW] Test-Tabelle beschreibt Tests, die so nicht existieren  — stale
- **Artikel/Datei:** operations/build-publish („Tests unter `tests/`")
- **Problem:** `scanner.test.ts` → „`SuperScanner`-Klasse" testet in Wahrheit `PrescriptionScanner` mit gemocktem Decoder. `integration.test.ts` → „End-to-End mit fake-WASM-Mock" prüft nur, dass Testbilder existieren und `CombinedDecoder` instanziierbar ist; `loadTestImage` gibt immer `null` zurück, es wird nichts dekodiert.
- **Beleg:** `tests/scanner.test.ts:15-17` `import { PrescriptionScanner } from '../src/modal'; describe('PrescriptionScanner', …)`; `tests/integration.test.ts:28-48` `// Would need PNG decoder here - skip for now … return null;`, `:50-99` nur `describe('Test image files exist')` und `describe('CombinedDecoder')` mit `should instantiate decoder`.

### [LOW] `SuperScanner` als Eintrittspunkt vs. „nicht exportiert"; WASM-Singleton-Aussagen widersprechen sich  — contradiction
- **Artikel/Datei:** architecture/system-overview, architecture/modal-vs-headless, architecture/class-hierarchy, api/preloading
- **Problem:** system-overview listet unter „Vier Eintrittspunkte" fünf Zeilen inkl. `SuperScanner (scanner.ts) — Low-Level`; modal-vs-headless sagt korrekt, `SuperScanner` werde nicht aus `src/index.ts` exportiert. class-hierarchy behauptet „singleton WASM → ein Decoder-Load pro Page, mehrere Scanner möglich", preloading sagt „jede Instanz lädt ihren eigenen Module-Singleton". Code: nur das `<script>`-Tag wird geteilt, jeder `ScannerWasmDecoder` instanziiert via `createScanner()` ein eigenes WASM-Modul.
- **Beleg:** `src/index.ts` exportiert kein `SuperScanner` (Zeilen 10-69); `src/decoder/scanner-wasm.ts:62-70` `loadModule()` ruft pro Instanz `createScanner({…})`, `:72-77` `loadScript` prüft nur `window.createScanner`.

### [LOW] Embind-Namen und Fehlertext im Wiki stimmen nicht mit `build.sh` / Loader überein  — stale
- **Artikel/Datei:** wasm/wasm-build („JS-Bindings (Embind)"), api/preloading („Edge Cases")
- **Problem:** Wiki zeigt `function("scan", &scan_rgba_pixels)`, `value_object<WasmResult>("WasmResult")`, `register_vector<WasmResult>("ResultVector")`. Real: `function("scan", &scan)`, `value_object<ScanResult>("ScanResult")`, `register_vector<ScanResult>("vector<ScanResult>")`. preloading behauptet, ein `scanner.wasm`-404 melde „WASM loader not found" — dieser Fehler fällt nur, wenn `window.createScanner` nach dem Script-Load fehlt; ein `scanner.js`-404 rejected mit dem rohen `Event`, ein `.wasm`-404 endet im Emscripten-Abort.
- **Beleg:** `wasm/build.sh:102-114`; `src/decoder/scanner-wasm.ts:64-65` `if (!createScanner) throw new Error('WASM loader not found');`, `:81` `script.onerror = reject;`.

### [LOW] `npm run dev` löscht `dist/scanner.js`/`scanner.wasm`; kein CI trotz „im CI"  — gap
- **Artikel/Datei:** operations/build-publish („Scripts", „Edge Cases")
- **Problem:** `dev` = `tsup --watch` mit `clean: true` wischt `dist/` und kopiert die WASM-Files nicht zurück — im Working Tree fehlen sie aktuell (getrackte Dateien als gelöscht). Das Wiki erwähnt das nicht. Die Edge-Case-Zeile „`npm ci` reicht im CI" suggeriert eine CI, es gibt keine (`.github/` enthält nur `FUNDING.yml`); `prepublishOnly` baut ohne Tests.
- **Beleg:** `git status --short` → `D dist/scanner.js`, `D dist/scanner.wasm`; `tsup.config.ts:10` `clean: true`; `package.json` `"dev": "tsup --watch"` (ohne `cp`); `find .github -type f` → nur `.github/FUNDING.yml`.
