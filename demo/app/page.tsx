'use client';

import { useEffect, useRef, useState } from 'react';
import type { ScanResult, PrescriptionScanner } from '../../src';

type Mode = 'camera' | 'upload';

export default function Home() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('camera');
  const [dragOver, setDragOver] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<PrescriptionScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addResult = (result: ScanResult) => {
    setResults(prev => {
      if (prev.some(r => r.data === result.data)) return prev;
      return [result, ...prev];
    });
  };

  // Preload WASM when browser is idle
  useEffect(() => {
    let mounted = true;

    const initScanner = async () => {
      const { PrescriptionScanner } = await import('../../src');

      const scanner = new PrescriptionScanner({
        preload: 'idle',
        onReady: () => {
          if (mounted) setIsReady(true);
        },
        onScan: addResult,
        onError: (err: Error) => setError(err.message)
      });

      scannerRef.current = scanner;
    };

    initScanner();

    return () => {
      mounted = false;
      scannerRef.current?.stop();
    };
  }, []);

  const startCamera = async () => {
    if (!containerRef.current || !scannerRef.current) return;
    setError(null);

    try {
      await scannerRef.current.startCamera(containerRef.current);
      setIsScanning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kamera konnte nicht gestartet werden');
    }
  };

  const stopCamera = () => {
    scannerRef.current?.stop();
    scannerRef.current = null;
    setIsScanning(false);
  };

  const processFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const { PrescriptionScanner } = await import('../../src');
      const scanner = new PrescriptionScanner({ onScan: addResult });

      let fileResults: ScanResult[] = [];

      if (file.type === 'application/pdf') {
        fileResults = await scanner.scanPDF(file);
      } else if (file.type.startsWith('image/')) {
        const imageData = await loadImageData(file);
        fileResults = await scanner.scanImageData(imageData);
      } else {
        throw new Error('Nicht unterstütztes Format');
      }

      if (fileResults.length === 0) {
        setError('Kein Barcode gefunden');
      } else {
        fileResults.forEach(addResult);
      }

      scanner.destroy();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Verarbeiten');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadImageData = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    if (isScanning) stopCamera();
    setMode(newMode);
  };

  const openModalDemo = async () => {
    const { PrescriptionScanner } = await import('../../src');
    const modalScanner = new PrescriptionScanner({
      headless: false,
      title: 'Modal Demo',
      onScan: addResult,
      onError: (err: Error) => setError(err.message)
    });
    modalScanner.open();
  };

  useEffect(() => {
    return () => { scannerRef.current?.stop(); };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-white">
      <div className="max-w-lg mx-auto p-6">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Prescription Scanner
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            v1.1.3 • 495 KB • DataMatrix & QR Code
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => switchMode('camera')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
              ${mode === 'camera'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Kamera
          </button>
          <button
            onClick={() => switchMode('upload')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
              ${mode === 'upload'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Datei / PDF
          </button>
        </div>

        {/* Camera View */}
        {mode === 'camera' && (
          <div className="mb-4">
            <div
              ref={containerRef}
              className="relative w-full aspect-[4/3] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800"
            >
              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                  <p className="text-zinc-600 text-sm">Kamera nicht aktiv</p>
                </div>
              )}

              {/* Scan Frame Overlay */}
              {isScanning && (
                <>
                  <div className="absolute inset-8 border-2 border-white/20 rounded-lg pointer-events-none" />
                  <div className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-scanLine" />
                </>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex gap-3 mt-4">
              {!isScanning ? (
                <button
                  onClick={startCamera}
                  disabled={!isReady}
                  className={`flex-1 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                           ${isReady
                             ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30 active:scale-[0.98]'
                             : 'bg-zinc-700 cursor-wait'}`}
                >
                  {!isReady && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {isReady ? 'Kamera starten' : 'Scanner lädt...'}
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition-all
                           border border-zinc-700 active:scale-[0.98]"
                >
                  Stoppen
                </button>
              )}
            </div>
          </div>
        )}

        {/* Upload View */}
        {mode === 'upload' && (
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed transition-all cursor-pointer
                flex flex-col items-center justify-center gap-4
                ${dragOver
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/50'}
                ${isProcessing ? 'pointer-events-none' : ''}`}
            >
              {isProcessing ? (
                <>
                  <div className="w-12 h-12 border-4 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-zinc-400">Verarbeite...</p>
                </>
              ) : (
                <>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors
                    ${dragOver ? 'bg-emerald-500/20' : 'bg-zinc-800'}`}>
                    <svg className={`w-8 h-8 transition-colors ${dragOver ? 'text-emerald-400' : 'text-zinc-500'}`}
                         viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-zinc-300">
                      <span className="text-emerald-400 font-medium">Klicken</span> oder hierher ziehen
                    </p>
                    <p className="text-zinc-600 text-sm mt-1">PNG, JPG, PDF</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        <div className="bg-zinc-900/50 backdrop-blur rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-400">
              Ergebnisse
            </h2>
            {results.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                  {results.length}
                </span>
                <button
                  onClick={() => setResults([])}
                  className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <div className="p-4">
            {results.length === 0 ? (
              <p className="text-zinc-600 text-center py-8 text-sm">
                Noch keine Codes gescannt
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase">
                        {r.format}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="font-mono text-sm text-zinc-300 break-all">{r.data}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={openModalDemo}
            className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
            Built-in Modal Demo
          </button>
          <div className="text-xs text-zinc-600 text-center">
            <p>PDF Support • Multi-Code • Image Enhancement</p>
            <a
              href="https://www.npmjs.com/package/prescription-scanner"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 mt-1 inline-block"
            >
              npm install prescription-scanner
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
