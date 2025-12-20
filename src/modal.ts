/**
 * PRESCRIPTION SCANNER - Vanilla JS Modal
 * Zero dependencies, selbstständiges Modal mit Scanner
 */

import { SuperScanner } from './scanner';
import type { ScanResult, BarcodeFormat } from './types';

// ============================================
// TYPES
// ============================================

export interface ScannerModalOptions {
  /** Formate die gescannt werden sollen */
  formats?: BarcodeFormat[];
  /** Modal-Titel */
  title?: string;
  /** Button-Text */
  buttonText?: string;
  /** Nach erfolgreichem Scan schließen */
  closeOnScan?: boolean;
  /** Callback bei Scan */
  onScan?: (result: ScanResult) => void;
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
  background: rgba(0,0,0,0.8);
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
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
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
.ps-result {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: rgba(34,197,94,0.9);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
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
.ps-btn svg {
  width: 20px;
  height: 20px;
}
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

// ============================================
// MODAL CLASS
// ============================================

export class PrescriptionScanner {
  private options: Required<ScannerModalOptions>;
  private scanner: SuperScanner | null = null;
  private overlay: HTMLElement | null = null;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private stylesInjected = false;

  constructor(options: ScannerModalOptions = {}) {
    this.options = {
      formats: options.formats || ['DataMatrix', 'QRCode'],
      title: options.title || 'Barcode scannen',
      buttonText: options.buttonText || 'Scanner öffnen',
      closeOnScan: options.closeOnScan ?? false,
      onScan: options.onScan || (() => {}),
      onError: options.onError || console.error,
      onClose: options.onClose || (() => {}),
    };
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
    // Overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'ps-overlay';
    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) this.close();
    };

    // Modal HTML
    this.overlay.innerHTML = `
      <div class="ps-modal">
        <div class="ps-header">
          <h2 class="ps-title">${this.options.title}</h2>
          <button class="ps-close" aria-label="Schließen">&times;</button>
        </div>
        <div class="ps-content">
          <div class="ps-video-container">
            <video class="ps-video" playsinline muted></video>
            <div class="ps-loading">
              <div class="ps-spinner"></div>
              <span class="ps-loading-text">Scanner wird geladen...</span>
            </div>
          </div>
        </div>
        <div class="ps-footer">
          <button class="ps-cancel">Abbrechen</button>
        </div>
      </div>
    `;

    // Event Listeners
    this.overlay.querySelector('.ps-close')!.addEventListener('click', () => this.close());
    this.overlay.querySelector('.ps-cancel')!.addEventListener('click', () => this.close());

    // ESC Key
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);

    // Video Element
    this.video = this.overlay.querySelector('.ps-video');

    document.body.appendChild(this.overlay);
    document.body.style.overflow = 'hidden';
  }

  private async startScanner(): Promise<void> {
    if (!this.overlay || !this.video) return;

    const loadingEl = this.overlay.querySelector('.ps-loading') as HTMLElement;
    const containerEl = this.overlay.querySelector('.ps-video-container') as HTMLElement;

    try {
      // Scanner initialisieren
      this.scanner = new SuperScanner({
        formats: this.options.formats,
      });

      await this.scanner.init();

      // Scan Event
      this.scanner.on('scan', (result) => {
        this.showResult(result);
        this.options.onScan(result);

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

      // Scanner starten
      await this.scanner.start(this.video);

      // Loading ausblenden, Scan-Linie zeigen
      loadingEl.style.display = 'none';

      const scanLine = document.createElement('div');
      scanLine.className = 'ps-scan-line';
      containerEl.appendChild(scanLine);

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

    document.body.style.overflow = '';
  }

  private showResult(result: ScanResult): void {
    if (!this.overlay) return;

    const container = this.overlay.querySelector('.ps-video-container');
    if (!container) return;

    // Scan-Linie entfernen
    container.querySelector('.ps-scan-line')?.remove();

    // Ergebnis anzeigen
    const resultEl = document.createElement('div');
    resultEl.className = 'ps-result';
    resultEl.textContent = `✓ ${result.format}: ${result.data.substring(0, 50)}${result.data.length > 50 ? '...' : ''}`;
    container.appendChild(resultEl);

    // Nach 2 Sekunden entfernen
    setTimeout(() => {
      resultEl.remove();

      // Scan-Linie wieder zeigen wenn Modal noch offen und keine existiert
      if (this.overlay && !this.options.closeOnScan && !container.querySelector('.ps-scan-line')) {
        const scanLine = document.createElement('div');
        scanLine.className = 'ps-scan-line';
        container.appendChild(scanLine);
      }
    }, 2000);
  }
}

// ============================================
// CONVENIENCE FUNCTION
// ============================================

/**
 * Schnellstart - öffnet direkt einen Scanner
 *
 * @example
 * openScanner({
 *   onScan: (result) => console.log(result.data),
 *   closeOnScan: true
 * });
 */
export function openScanner(options: ScannerModalOptions = {}): PrescriptionScanner {
  const scanner = new PrescriptionScanner(options);
  scanner.open();
  return scanner;
}

export default PrescriptionScanner;
