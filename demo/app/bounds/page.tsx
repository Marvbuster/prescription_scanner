'use client';

import { useEffect, useRef, useState } from 'react';
import type { ScanResult, ScanBounds, PrescriptionScanner } from '../../../src';
import Link from 'next/link';

export default function BoundsDemo() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bounds, setBounds] = useState<ScanBounds>({ x: 0.15, y: 0.15, width: 0.7, height: 0.7 });
  const [computedBounds, setComputedBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<PrescriptionScanner | null>(null);

  const addResult = (result: ScanResult) => {
    setResults(prev => {
      if (prev.some(r => r.data === result.data)) return prev;
      return [result, ...prev];
    });
  };

  useEffect(() => {
    let mounted = true;

    const initScanner = async () => {
      const { PrescriptionScanner } = await import('../../../src');

      const scanner = new PrescriptionScanner({
        preload: 'idle',
        scanBounds: bounds,
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

  useEffect(() => {
    if (scannerRef.current) {
      scannerRef.current.setScanBounds(bounds);
      updateComputedBounds();
    }
  }, [bounds]);

  const updateComputedBounds = () => {
    if (scannerRef.current) {
      const computed = scannerRef.current.getComputedBounds();
      setComputedBounds(computed);
    }
  };

  const startCamera = async () => {
    if (!containerRef.current || !scannerRef.current) return;
    setError(null);

    try {
      await scannerRef.current.startCamera(containerRef.current);
      setIsScanning(true);
      setTimeout(updateComputedBounds, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kamera konnte nicht gestartet werden');
    }
  };

  const stopCamera = () => {
    scannerRef.current?.stop();
    setIsScanning(false);
    setComputedBounds(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-white">
      <div className="max-w-5xl mx-auto p-6">

        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="text-zinc-500 hover:text-white text-sm mb-2 inline-block">
            &larr; Zurück
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            ScanBounds Demo
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Scannt nur innerhalb des Rahmens
          </p>
        </div>

        {/* Main Layout: Video left, Results right on desktop */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Column: Camera + Controls */}
          <div className="flex-1 lg:max-w-xl">
            {/* Camera View with Bounds Overlay */}
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

                {/* Scan Bounds Overlay */}
                {isScanning && (
                  <>
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `linear-gradient(to right,
                          rgba(0,0,0,0.6) ${bounds.x * 100}%,
                          transparent ${bounds.x * 100}%,
                          transparent ${(bounds.x + bounds.width) * 100}%,
                          rgba(0,0,0,0.6) ${(bounds.x + bounds.width) * 100}%)`
                      }}
                    />
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${bounds.x * 100}%`,
                        right: `${(1 - bounds.x - bounds.width) * 100}%`,
                        top: 0,
                        height: `${bounds.y * 100}%`,
                        background: 'rgba(0,0,0,0.6)'
                      }}
                    />
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${bounds.x * 100}%`,
                        right: `${(1 - bounds.x - bounds.width) * 100}%`,
                        bottom: 0,
                        height: `${(1 - bounds.y - bounds.height) * 100}%`,
                        background: 'rgba(0,0,0,0.6)'
                      }}
                    />
                    <div
                      className="absolute border-2 border-emerald-500 rounded-lg pointer-events-none"
                      style={{
                        left: `${bounds.x * 100}%`,
                        top: `${bounds.y * 100}%`,
                        width: `${bounds.width * 100}%`,
                        height: `${bounds.height * 100}%`,
                      }}
                    />
                    <div
                      className="absolute h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-scanLine pointer-events-none"
                      style={{
                        left: `${bounds.x * 100}%`,
                        width: `${bounds.width * 100}%`,
                      }}
                    />
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
                               ? 'bg-blue-600 hover:bg-blue-500 shadow-lg'
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
                    className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition-all border border-zinc-700"
                  >
                    Stoppen
                  </button>
                )}
              </div>
            </div>

            {/* Bounds Controls */}
            <div className="bg-zinc-900/50 backdrop-blur rounded-2xl border border-zinc-800 p-4 mb-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Scan-Bereich anpassen</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 flex justify-between">
                    <span>X-Offset</span>
                    <span>{Math.round(bounds.x * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.4"
                    step="0.01"
                    value={bounds.x}
                    onChange={(e) => setBounds(b => ({ ...b, x: parseFloat(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 flex justify-between">
                    <span>Y-Offset</span>
                    <span>{Math.round(bounds.y * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.4"
                    step="0.01"
                    value={bounds.y}
                    onChange={(e) => setBounds(b => ({ ...b, y: parseFloat(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 flex justify-between">
                    <span>Breite</span>
                    <span>{Math.round(bounds.width * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="1"
                    step="0.01"
                    value={bounds.width}
                    onChange={(e) => setBounds(b => ({ ...b, width: parseFloat(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 flex justify-between">
                    <span>Höhe</span>
                    <span>{Math.round(bounds.height * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="1"
                    step="0.01"
                    value={bounds.height}
                    onChange={(e) => setBounds(b => ({ ...b, height: parseFloat(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              {computedBounds && (
                <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-xs text-zinc-500 mb-1">Pixel-Werte:</p>
                  <code className="text-xs text-emerald-400">
                    {`x:${computedBounds.x} y:${computedBounds.y} w:${computedBounds.width} h:${computedBounds.height}`}
                  </code>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Results + Code (desktop) / Below (mobile) */}
          <div className="lg:w-80 space-y-4">
            {/* Results */}
            <div className="bg-zinc-900/50 backdrop-blur rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-400">Ergebnisse</h2>
                {results.length > 0 && (
                  <button
                    onClick={() => {
                      setResults([]);
                      scannerRef.current?.clearResults();
                    }}
                    className="text-xs text-zinc-500 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="p-4">
                {results.length === 0 ? (
                  <p className="text-zinc-600 text-center py-4 text-sm">
                    Noch keine Codes gescannt
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {results.map((r, i) => (
                      <div key={i} className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase">
                            {r.format}
                          </span>
                        </div>
                        <p className="font-mono text-sm text-zinc-300 break-all">{r.data}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Code Example */}
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">Code:</p>
              <pre className="text-xs text-emerald-400 overflow-x-auto">
{`scanner.setScanBounds({
  x: ${bounds.x.toFixed(2)},
  y: ${bounds.y.toFixed(2)},
  width: ${bounds.width.toFixed(2)},
  height: ${bounds.height.toFixed(2)}
});`}
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
