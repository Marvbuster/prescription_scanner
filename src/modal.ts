/**
 * PRESCRIPTION SCANNER v1.1 - Vanilla JS Modal
 * Zero dependencies, mit PDF & Multi-Code Support
 */

import { SuperScanner } from './scanner';
import { processPDF, isPDF } from './pdf';
import { enhanceForScanning } from './preprocessing';
import type { ScanResult, BarcodeFormat } from './types';

// ============================================
// TYPES
// ============================================

export type PreloadStrategy = 'idle' | 'eager' | 'lazy' | false;

export interface ScannerOptions {
  /** Headless mode - no modal UI, just scanning API */
  headless?: boolean;
  /**
   * WASM preload strategy:
   * - 'lazy' (default): Load on first use
   * - 'idle': Load when browser is idle (requestIdleCallback)
   * - 'eager': Load immediately on instantiation
   * - false: Manual loading via preload() or init()
   */
  preload?: PreloadStrategy;
  /** Formate die gescannt werden sollen */
  formats?: BarcodeFormat[];
  /** Modal-Titel */
  title?: string;
  /** Button-Text */
  buttonText?: string;
  /** Nach erfolgreichem Scan schließen */
  closeOnScan?: boolean;
  /** Callback when WASM is loaded and scanner is ready */
  onReady?: () => void;
  /** Callback bei Scan (wird für jeden gefundenen Code aufgerufen) */
  onScan?: (result: ScanResult) => void;
  /** Callback bei mehreren Codes auf einmal */
  onMultiScan?: (results: ScanResult[]) => void;
  /** Callback bei Fehler */
  onError?: (error: Error) => void;
  /** Callback wenn Modal schließt */
  onClose?: () => void;
}


// ============================================
// STYLES
// ============================================

const STYLES = `
.ps-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.ps-modal {
  background: #1a1a1a;
  border-radius: 12px;
  max-width: 520px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
}
.ps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #333;
}
.ps-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}
.ps-close {
  background: none;
  border: none;
  color: #888;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
.ps-close:hover { color: #fff; }
.ps-content {
  padding: 20px;
}
.ps-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.ps-tab {
  flex: 1;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #888;
  background: #252525;
  border: 1px solid #333;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.ps-tab:hover { background: #2a2a2a; }
.ps-tab.active {
  color: #fff;
  background: #2563eb;
  border-color: #2563eb;
}
.ps-tab svg { width: 18px; height: 18px; }
.ps-video-container {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}
.ps-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ps-upload-zone {
  width: 100%;
  aspect-ratio: 4/3;
  background: #252525;
  border: 2px dashed #444;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.ps-upload-zone:hover, .ps-upload-zone.dragover {
  border-color: #2563eb;
  background: #1e3a5f;
}
.ps-upload-zone svg {
  width: 48px;
  height: 48px;
  color: #666;
}
.ps-upload-zone.dragover svg { color: #2563eb; }
.ps-upload-text {
  color: #888;
  font-size: 14px;
  text-align: center;
}
.ps-upload-text strong { color: #2563eb; }
.ps-upload-hint {
  color: #666;
  font-size: 12px;
}
.ps-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.8);
  gap: 16px;
}
.ps-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #333;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: ps-spin 1s linear infinite;
}
.ps-loading-text {
  color: #888;
  font-size: 14px;
}
.ps-scan-line {
  position: absolute;
  left: 10%;
  right: 10%;
  height: 2px;
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
  animation: ps-scan 2s ease-in-out infinite;
}
.ps-results {
  margin-top: 16px;
  max-height: 200px;
  overflow-y: auto;
}
.ps-result-item {
  padding: 12px;
  background: #252525;
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 3px solid #22c55e;
}
.ps-result-format {
  font-size: 11px;
  font-weight: 600;
  color: #22c55e;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.ps-result-data {
  font-size: 13px;
  color: #fff;
  word-break: break-all;
  font-family: monospace;
}
.ps-result-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #22c55e;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border-radius: 20px;
  margin-bottom: 12px;
}
.ps-footer {
  padding: 16px 20px;
  border-top: 1px solid #333;
  display: flex;
  justify-content: center;
}
.ps-cancel {
  padding: 10px 24px;
  font-size: 14px;
  color: #888;
  background: transparent;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
}
.ps-cancel:hover {
  color: #fff;
  border-color: #666;
}
.ps-btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: #2563eb;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.ps-btn:hover { background: #1d4ed8; }
.ps-btn svg { width: 20px; height: 20px; }
.ps-hidden { display: none !important; }
@keyframes ps-spin {
  to { transform: rotate(360deg); }
}
@keyframes ps-scan {
  0%, 100% { top: 10%; opacity: 1; }
  50% { top: 80%; opacity: 0.5; }
}
`;

const SCANNER_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
  <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
  <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
  <line x1="7" y1="12" x2="17" y2="12"/>
</svg>`;

const CAMERA_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
  <circle cx="12" cy="13" r="4"/>
</svg>`;

const UPLOAD_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline points="17 8 12 3 7 8"/>
  <line x1="12" y1="3" x2="12" y2="15"/>
</svg>`;

const FILE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
</svg>`;

// ============================================
// MODAL CLASS
// ============================================

export class PrescriptionScanner {
  private options: Required<ScannerOptions>;
  private scanner: SuperScanner | null = null;
  private overlay: HTMLElement | null = null;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private stylesInjected = false;
  private results: ScanResult[] = [];
  private mode: 'camera' | 'upload' = 'camera';
  private fileInput: HTMLInputElement | null = null;
  private initialized = false;
  private initializing = false;

  constructor(options: ScannerOptions = {}) {
    this.options = {
      headless: options.headless ?? true,
      preload: options.preload ?? 'lazy',
      formats: options.formats || ['DataMatrix', 'QRCode'],
      title: options.title || 'Barcode scannen',
      buttonText: options.buttonText || 'Scanner öffnen',
      closeOnScan: options.closeOnScan ?? false,
      onReady: options.onReady || (() => {}),
      onScan: options.onScan || (() => {}),
      onMultiScan: options.onMultiScan || (() => {}),
      onError: options.onError || (() => {}),
      onClose: options.onClose || (() => {}),
    };

    // Handle preload strategy
    this.handlePreload();
  }

  /**
   * Handle preload strategy
   */
  private handlePreload(): void {
    const strategy = this.options.preload;

    if (strategy === 'eager') {
      // Load immediately
      this.preload();
    } else if (strategy === 'idle') {
      // Load when browser is idle
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => this.preload(), { timeout: 5000 });
      } else {
        // Fallback for Safari
        setTimeout(() => this.preload(), 100);
      }
    }
    // 'lazy' and false: do nothing, load on first use
  }

  /**
   * Preload WASM module in background
   * Triggers onReady callback when complete
   */
  preload(): Promise<void> {
    return this.init();
  }

  /**
   * Initialize scanner and load WASM
   * Triggers onReady callback when complete
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) {
      // Wait for ongoing initialization
      while (this.initializing) {
        await new Promise(r => setTimeout(r, 10));
      }
      return;
    }

    this.initializing = true;
    try {
      this.scanner = new SuperScanner({ formats: this.options.formats });
      await this.scanner.init();
      this.initialized = true;
      this.options.onReady();
    } finally {
      this.initializing = false;
    }
  }

  /**
   * Check if WASM is loaded and scanner is ready
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Scan an image element (headless mode)
   */
  async scanImage(image: HTMLImageElement): Promise<ScanResult[]> {
    await this.init();
    return this.scanner!.scanImage(image);
  }

  /**
   * Scan ImageData directly (headless mode)
   */
  async scanImageData(imageData: ImageData): Promise<ScanResult[]> {
    await this.init();
    const enhanced = enhanceForScanning(imageData);
    return this.scanner!.scanImageData(enhanced);
  }

  /**
   * Scan a canvas element (headless mode)
   */
  async scanCanvas(canvas: HTMLCanvasElement): Promise<ScanResult[]> {
    await this.init();
    return this.scanner!.scanCanvas(canvas);
  }

  /**
   * Scan a PDF file (headless mode)
   */
  async scanPDF(file: File | ArrayBuffer): Promise<ScanResult[]> {
    await this.init();
    const pages = await processPDF(file, { scale: 2 });
    const allResults: ScanResult[] = [];

    for (const page of pages) {
      const enhanced = enhanceForScanning(page.imageData);
      const results = await this.scanner!.scanImageData(enhanced);
      allResults.push(...results);
    }

    return this.deduplicateResults(allResults);
  }

  /**
   * Start continuous scanning on a video element (headless mode)
   * The video element must already have a camera stream attached
   */
  async start(videoElement: HTMLVideoElement): Promise<void> {
    await this.init();

    // Register scan handler
    this.scanner!.on('scan', (result) => {
      this.addResult(result);
    });

    this.scanner!.on('error', (error) => {
      this.options.onError(error);
    });

    await this.scanner!.start(videoElement);
    this.video = videoElement;
  }

  /**
   * Start camera and scanning in a container (headless mode)
   * Creates a video element and requests camera access
   * Returns the video element for custom styling
   */
  async startCamera(container: HTMLElement): Promise<HTMLVideoElement> {
    await this.init();

    // Create video element
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.muted = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    container.appendChild(video);

    // Request camera
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    video.srcObject = this.stream;
    await video.play();

    // Register scan handler
    this.scanner!.on('scan', (result) => {
      this.addResult(result);
    });

    this.scanner!.on('error', (error) => {
      this.options.onError(error);
    });

    await this.scanner!.start(video);
    this.video = video;

    return video;
  }

  /**
   * Stop camera scanning (headless mode)
   * Cleans up camera stream and video element
   */
  stop(): void {
    // Stop scanner
    this.scanner?.stop();

    // Stop camera stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Remove video element if we created it
    if (this.video && this.video.parentElement) {
      this.video.srcObject = null;
      this.video.remove();
    }
    this.video = null;
  }

  /**
   * Check if currently scanning
   */
  isScanning(): boolean {
    return this.scanner?.isScanning() ?? false;
  }

  /**
   * Erstellt einen Button der das Scanner-Modal öffnet
   */
  createButton(container?: HTMLElement): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'ps-btn';
    btn.innerHTML = `${SCANNER_ICON} ${this.options.buttonText}`;
    btn.onclick = () => this.open();

    if (container) {
      container.appendChild(btn);
    }

    return btn;
  }

  /**
   * Öffnet das Scanner-Modal
   */
  async open(): Promise<void> {
    this.results = [];
    this.injectStyles();
    this.createModal();
    await this.startScanner();
  }

  /**
   * Schließt das Scanner-Modal
   */
  close(): void {
    this.stopScanner();

    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    // Emit all collected results
    if (this.results.length > 0) {
      this.options.onMultiScan(this.results);
    }

    this.options.onClose();
  }

  /**
   * Cleanup - alle Ressourcen freigeben
   */
  destroy(): void {
    this.close();
    this.scanner?.destroy();
    this.scanner = null;
  }

  /**
   * Gibt alle bisher gefundenen Ergebnisse zurück
   */
  getResults(): ScanResult[] {
    return [...this.results];
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private injectStyles(): void {
    if (this.stylesInjected) return;

    const style = document.createElement('style');
    style.id = 'prescription-scanner-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);

    this.stylesInjected = true;
  }

  private createModal(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'ps-overlay';
    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) this.close();
    };

    this.overlay.innerHTML = `
      <div class="ps-modal">
        <div class="ps-header">
          <h2 class="ps-title">${this.options.title}</h2>
          <button class="ps-close" aria-label="Schließen">&times;</button>
        </div>
        <div class="ps-content">
          <div class="ps-tabs">
            <button class="ps-tab active" data-mode="camera">
              ${CAMERA_ICON} Kamera
            </button>
            <button class="ps-tab" data-mode="upload">
              ${FILE_ICON} Datei/PDF
            </button>
          </div>
          <div class="ps-camera-view">
            <div class="ps-video-container">
              <video class="ps-video" playsinline muted></video>
              <div class="ps-loading">
                <div class="ps-spinner"></div>
                <span class="ps-loading-text">Scanner wird geladen...</span>
              </div>
            </div>
          </div>
          <div class="ps-upload-view ps-hidden">
            <div class="ps-upload-zone">
              ${UPLOAD_ICON}
              <span class="ps-upload-text"><strong>Klicken</strong> oder Datei hierher ziehen</span>
              <span class="ps-upload-hint">Bilder (JPG, PNG) oder PDF</span>
            </div>
          </div>
          <div class="ps-results"></div>
        </div>
        <div class="ps-footer">
          <button class="ps-cancel">Schließen</button>
        </div>
      </div>
    `;

    // Event Listeners
    this.overlay.querySelector('.ps-close')!.addEventListener('click', () => this.close());
    this.overlay.querySelector('.ps-cancel')!.addEventListener('click', () => this.close());

    // Tab switching
    const tabs = this.overlay.querySelectorAll('.ps-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.getAttribute('data-mode') as 'camera' | 'upload';
        this.switchMode(mode);
      });
    });

    // File upload
    const uploadZone = this.overlay.querySelector('.ps-upload-zone') as HTMLElement;
    this.setupUploadZone(uploadZone);

    // ESC Key
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    this.video = this.overlay.querySelector('.ps-video');

    document.body.appendChild(this.overlay);
    document.body.style.overflow = 'hidden';
  }

  private setupUploadZone(zone: HTMLElement): void {
    // Create hidden file input
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*,application/pdf';
    this.fileInput.style.display = 'none';

    this.fileInput.addEventListener('change', () => {
      const file = this.fileInput?.files?.[0];
      if (file) this.processFile(file);
    });

    zone.appendChild(this.fileInput);

    // Click to upload
    zone.addEventListener('click', () => {
      this.fileInput?.click();
    });

    // Drag & Drop
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const file = e.dataTransfer?.files[0];
      if (file) this.processFile(file);
    });
  }

  private switchMode(mode: 'camera' | 'upload'): void {
    if (!this.overlay) return;
    this.mode = mode;

    const tabs = this.overlay.querySelectorAll('.ps-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-mode') === mode);
    });

    const cameraView = this.overlay.querySelector('.ps-camera-view') as HTMLElement;
    const uploadView = this.overlay.querySelector('.ps-upload-view') as HTMLElement;

    if (mode === 'camera') {
      cameraView.classList.remove('ps-hidden');
      uploadView.classList.add('ps-hidden');
      if (!this.scanner?.isScanning()) {
        this.startScanner();
      }
    } else {
      cameraView.classList.add('ps-hidden');
      uploadView.classList.remove('ps-hidden');
      this.stopScanner();
    }
  }

  private async processFile(file: File): Promise<void> {
    if (!this.overlay) return;

    const uploadZone = this.overlay.querySelector('.ps-upload-zone') as HTMLElement;
    const originalContent = uploadZone.innerHTML;

    // Show loading
    uploadZone.innerHTML = `
      <div class="ps-spinner"></div>
      <span class="ps-loading-text">Verarbeite ${file.name}...</span>
    `;

    try {
      // Initialize scanner if needed
      if (!this.scanner) {
        this.scanner = new SuperScanner({ formats: this.options.formats });
        await this.scanner.init();
      }

      let foundResults: ScanResult[] = [];

      if (isPDF(file)) {
        // Process PDF
        const pages = await processPDF(file, {
          scale: 2,
          onProgress: (current, total) => {
            const loadingText = uploadZone.querySelector('.ps-loading-text');
            if (loadingText) {
              loadingText.textContent = `Seite ${current}/${total}...`;
            }
          },
        });

        for (const page of pages) {
          // Enhance PDF page for better detection
          const enhanced = enhanceForScanning(page.imageData);
          const results = await this.scanner.scanImageData(enhanced);
          foundResults.push(...results);
        }
      } else {
        // Process image with enhancement
        const imageData = await this.loadImage(file);
        const enhanced = enhanceForScanning(imageData);
        foundResults = await this.scanner.scanImageData(enhanced);
      }

      // Deduplicate by data content
      const unique = this.deduplicateResults(foundResults);

      if (unique.length > 0) {
        for (const result of unique) {
          this.addResult(result);
        }
        uploadZone.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="width:48px;height:48px">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span class="ps-loading-text" style="color:#22c55e">${unique.length} Code${unique.length > 1 ? 's' : ''} gefunden!</span>
        `;
      } else {
        uploadZone.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="width:48px;height:48px">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span class="ps-loading-text" style="color:#ef4444">Kein Barcode gefunden</span>
        `;
      }

      // Reset after delay
      setTimeout(() => {
        if (uploadZone && this.overlay) {
          uploadZone.innerHTML = originalContent;
          this.setupUploadZone(uploadZone);
        }
      }, 2500);

    } catch (error) {
      uploadZone.innerHTML = `
        <span class="ps-loading-text" style="color:#ef4444">
          Fehler: ${error instanceof Error ? error.message : 'Unbekannt'}
        </span>
      `;
      this.options.onError(error instanceof Error ? error : new Error(String(error)));

      setTimeout(() => {
        if (uploadZone && this.overlay) {
          uploadZone.innerHTML = originalContent;
          this.setupUploadZone(uploadZone);
        }
      }, 3000);
    }
  }

  private async loadImage(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      };
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
      img.src = URL.createObjectURL(file);
    });
  }

  private deduplicateResults(results: ScanResult[]): ScanResult[] {
    const seen = new Set<string>();
    return results.filter(r => {
      const key = `${r.format}:${r.data}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async startScanner(): Promise<void> {
    if (!this.overlay || !this.video) return;

    const loadingEl = this.overlay.querySelector('.ps-loading') as HTMLElement;
    const containerEl = this.overlay.querySelector('.ps-video-container') as HTMLElement;

    try {
      this.scanner = new SuperScanner({
        formats: this.options.formats,
      });

      await this.scanner.init();

      // Scan Event
      this.scanner.on('scan', (result) => {
        this.addResult(result);

        if (this.options.closeOnScan) {
          setTimeout(() => this.close(), 1000);
        }
      });

      // Kamera starten
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      this.video.srcObject = this.stream;
      await this.video.play();

      await this.scanner.start(this.video);

      loadingEl.style.display = 'none';

      // Only add scan line if none exists
      if (!containerEl.querySelector('.ps-scan-line')) {
        const scanLine = document.createElement('div');
        scanLine.className = 'ps-scan-line';
        containerEl.appendChild(scanLine);
      }

    } catch (error) {
      loadingEl.innerHTML = `
        <span class="ps-loading-text" style="color: #ef4444;">
          Fehler: ${error instanceof Error ? error.message : 'Unbekannt'}
        </span>
      `;
      this.options.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private stopScanner(): void {
    this.scanner?.stop();

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    // Remove scan line when stopping
    if (this.overlay) {
      this.overlay.querySelector('.ps-scan-line')?.remove();
    }

    document.body.style.overflow = '';
  }

  private addResult(result: ScanResult): void {
    // Check for duplicate
    const isDuplicate = this.results.some(r => r.data === result.data && r.format === result.format);
    if (isDuplicate) return;

    this.results.push(result);
    this.options.onScan(result);
    this.updateResultsUI();
  }

  private updateResultsUI(): void {
    if (!this.overlay) return;

    const resultsEl = this.overlay.querySelector('.ps-results') as HTMLElement;
    if (!resultsEl) return;

    resultsEl.innerHTML = `
      <div class="ps-result-count">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        ${this.results.length} Code${this.results.length > 1 ? 's' : ''} gefunden
      </div>
      ${this.results.map(r => `
        <div class="ps-result-item">
          <div class="ps-result-format">${r.format}</div>
          <div class="ps-result-data">${this.escapeHtml(r.data)}</div>
        </div>
      `).join('')}
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ============================================
// CONVENIENCE FUNCTION
// ============================================

/**
 * Schnellstart - öffnet direkt einen Scanner
 */
export function openScanner(options: ScannerOptions = {}): PrescriptionScanner {
  const scanner = new PrescriptionScanner(options);
  scanner.open();
  return scanner;
}

export default PrescriptionScanner;
