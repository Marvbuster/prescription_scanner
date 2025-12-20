import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM + CJS für npm
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: true,
  },
  // IIFE Bundle für Browser (vanilla JS)
  {
    entry: { 'prescription-scanner': 'src/index.ts' },
    format: ['iife'],
    globalName: 'PrescriptionScanner',
    outDir: 'dist/browser',
    sourcemap: true,
    minify: true,
    platform: 'browser',
  },
]);
