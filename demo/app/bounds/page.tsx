'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ScanResult, ScanBounds, PrescriptionScanner } from '../../../src';
import Link from 'next/link';

interface AnimatedCode {
  id: number;
  imageData: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  phase: 'zoom-in' | 'hold' | 'burst';
  scale: number;
  opacity: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
  rotation: number;
  rotationSpeed: number;
}

export default function BoundsDemo() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bounds, setBounds] = useState<ScanBounds>({ x: 0.15, y: 0.15, width: 0.7, height: 0.7 });
  const [computedBounds, setComputedBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [showPositionDemo, setShowPositionDemo] = useState(false);
  const [animatedCodes, setAnimatedCodes] = useState<AnimatedCode[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<PrescriptionScanner | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>();

  // Particle animation loop
  const animateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let hasActiveParticles = false;

    for (const p of particlesRef.current) {
      if (p.alpha <= 0) continue;
      hasActiveParticles = true;

      // Update physics
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.vy += 0.1; // slight gravity
      p.alpha -= 0.015;
      p.size *= 0.97;
      p.rotation += p.rotationSpeed;

      // Draw particle with glow
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.alpha;

      // Outer glow
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
      gradient.addColorStop(0, `hsla(${p.hue}, 80%, 60%, 0.8)`);
      gradient.addColorStop(0.5, `hsla(${p.hue}, 70%, 50%, 0.3)`);
      gradient.addColorStop(1, `hsla(${p.hue}, 60%, 40%, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright core
      ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, 1)`;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    if (hasActiveParticles) {
      rafRef.current = requestAnimationFrame(animateParticles);
    } else {
      particlesRef.current = [];
      rafRef.current = undefined;
    }
  }, []);

  // Create particle explosion
  const createExplosion = useCallback((centerX: number, centerY: number, width: number, height: number) => {
    const particles: Particle[] = [];
    const particleCount = 40;
    const baseSize = Math.min(width, height) / 8;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 6;
      const distanceFromCenter = Math.random() * Math.min(width, height) * 0.3;

      particles.push({
        x: centerX + Math.cos(angle) * distanceFromCenter,
        y: centerY + Math.sin(angle) * distanceFromCenter,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: baseSize * (0.5 + Math.random() * 1),
        alpha: 0.8 + Math.random() * 0.2,
        hue: 150 + Math.random() * 20, // emerald hues
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    // Add some extra sparkles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 8;

      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: baseSize * 0.3,
        alpha: 1,
        hue: 160 + Math.random() * 30,
        rotation: 0,
        rotationSpeed: 0,
      });
    }

    particlesRef.current = [...particlesRef.current, ...particles];

    if (!rafRef.current) {
      animateParticles();
    }
  }, [animateParticles]);

  const captureCodeArea = useCallback((result: ScanResult): AnimatedCode | null => {
    const video = containerRef.current?.querySelector('video');
    if (!video || !result.points || result.points.length < 3) return null;

    // Calculate bounding box from points
    const xs = result.points.map(p => p.x);
    const ys = result.points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const codeWidth = maxX - minX;
    const codeHeight = maxY - minY;

    // Add padding
    const padding = Math.max(codeWidth, codeHeight) * 0.2;
    const captureX = Math.max(0, minX - padding);
    const captureY = Math.max(0, minY - padding);
    const captureW = Math.min(video.videoWidth - captureX, codeWidth + padding * 2);
    const captureH = Math.min(video.videoHeight - captureY, codeHeight + padding * 2);

    // Capture from video
    const canvas = document.createElement('canvas');
    canvas.width = captureW;
    canvas.height = captureH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, captureX, captureY, captureW, captureH, 0, 0, captureW, captureH);

    // Calculate position relative to container
    const containerRect = containerRef.current!.getBoundingClientRect();
    const scaleX = containerRect.width / video.videoWidth;
    const scaleY = containerRect.height / video.videoHeight;

    const displayX = captureX * scaleX;
    const displayY = captureY * scaleY;
    const displayW = captureW * scaleX;
    const displayH = captureH * scaleY;

    return {
      id: ++animationIdRef.current,
      imageData: canvas.toDataURL(),
      x: displayX,
      y: displayY,
      width: displayW,
      height: displayH,
      centerX: displayX + displayW / 2,
      centerY: displayY + displayH / 2,
      phase: 'zoom-in',
      scale: 1,
      opacity: 1,
    };
  }, []);

  const animateCode = useCallback((code: AnimatedCode) => {
    setAnimatedCodes(prev => [...prev, code]);

    // Phase 1: Zoom in (1.5 seconds)
    setTimeout(() => {
      setAnimatedCodes(prev =>
        prev.map(c => c.id === code.id ? { ...c, phase: 'hold' as const } : c)
      );

      // Phase 2: Hold (400ms)
      setTimeout(() => {
        // Start burst phase
        setAnimatedCodes(prev =>
          prev.map(c => c.id === code.id ? { ...c, phase: 'burst' as const } : c)
        );

        // Create particle explosion
        createExplosion(code.centerX, code.centerY, code.width * 2, code.height * 2);

        // Animate the image shrinking and fading during burst
        const startTime = Date.now();
        const burstDuration = 400;

        const animateBurst = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / burstDuration, 1);

          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);

          setAnimatedCodes(prev =>
            prev.map(c => {
              if (c.id !== code.id) return c;
              return {
                ...c,
                scale: 2 - eased * 1.5, // 2 -> 0.5
                opacity: 1 - eased,
              };
            })
          );

          if (progress < 1) {
            requestAnimationFrame(animateBurst);
          } else {
            // Remove from list
            setAnimatedCodes(prev => prev.filter(c => c.id !== code.id));
          }
        };

        requestAnimationFrame(animateBurst);
      }, 400);
    }, 1500);
  }, [createExplosion]);

  const showPositionDemoRef = useRef(showPositionDemo);
  useEffect(() => {
    showPositionDemoRef.current = showPositionDemo;
  }, [showPositionDemo]);

  const handleScan = useCallback((result: ScanResult) => {
    // Add to results
    setResults(prev => {
      if (prev.some(r => r.data === result.data)) return prev;
      return [result, ...prev];
    });

    // Animate if position demo is enabled
    if (showPositionDemoRef.current && result.points && result.points.length >= 3) {
      const animatedCode = captureCodeArea(result);
      if (animatedCode) {
        animateCode(animatedCode);
      }
    }
  }, [captureCodeArea, animateCode]);

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
        onScan: handleScan,
        onError: (err: Error) => setError(err.message)
      });

      scannerRef.current = scanner;
    };

    initScanner();

    return () => {
      mounted = false;
      scannerRef.current?.stop();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScan]);

  // Update canvas size when container changes
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (container && canvas) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isScanning]);

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
      const video = await scannerRef.current.startCamera(containerRef.current);
      videoRef.current = video;
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
    setAnimatedCodes([]);
    particlesRef.current = [];
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-white">
      <style jsx>{`
        @keyframes zoomIn {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(2);
            opacity: 1;
          }
        }
        .animate-zoom-in {
          animation: zoomIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

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
                  </>
                )}

                {/* Animated Code Captures */}
                {animatedCodes.map(code => (
                  <div
                    key={code.id}
                    className={`absolute pointer-events-none ${
                      code.phase === 'zoom-in' ? 'animate-zoom-in' : ''
                    }`}
                    style={{
                      left: code.x,
                      top: code.y,
                      width: code.width,
                      height: code.height,
                      transformOrigin: 'center',
                      zIndex: 50,
                      ...(code.phase === 'burst' ? {
                        transform: `scale(${code.scale})`,
                        opacity: code.opacity,
                      } : code.phase === 'hold' ? {
                        transform: 'scale(2)',
                      } : {}),
                    }}
                  >
                    <img
                      src={code.imageData}
                      alt="Detected code"
                      className="w-full h-full rounded-lg border-2 border-emerald-400"
                      style={{
                        boxShadow: code.phase === 'burst'
                          ? `0 0 ${30 * code.opacity}px rgba(16, 185, 129, ${code.opacity * 0.8})`
                          : '0 0 30px rgba(16, 185, 129, 0.6)',
                      }}
                    />
                  </div>
                ))}

                {/* Particle Canvas */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: 51 }}
                />
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

            {/* Position Demo Toggle */}
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-zinc-300">Positionserkennung</p>
                  <p className="text-xs text-zinc-500">Zeigt erkannte Codes mit Animation</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showPositionDemo}
                    onChange={(e) => setShowPositionDemo(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${showPositionDemo ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showPositionDemo ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
              </label>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
