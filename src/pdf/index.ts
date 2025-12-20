/**
 * PDF Processor - Extracts images from PDFs for barcode scanning
 * Uses PDF.js loaded dynamically from CDN
 */

// PDF.js types
interface PDFViewport {
  width: number;
  height: number;
}

interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNum: number): Promise<PDFPageProxy>;
  destroy(): void;
}

interface PDFPageProxy {
  getViewport(params: { scale: number }): PDFViewport;
  render(params: { canvasContext: CanvasRenderingContext2D; viewport: PDFViewport }): { promise: Promise<void> };
}

interface PDFLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(src: { data: ArrayBuffer }): { promise: Promise<PDFDocumentProxy> };
}

interface WindowWithPdfJs {
  pdfjsLib?: PDFLib;
}

let pdfLib: PDFLib | null = null;
let loadingPromise: Promise<void> | null = null;

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Load PDF.js from CDN
 */
async function loadPdfJs(): Promise<void> {
  if (pdfLib) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDFJS_CDN;
    script.onload = () => {
      const pdfjsLib = (window as unknown as WindowWithPdfJs).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;
        pdfLib = pdfjsLib;
        resolve();
      } else {
        reject(new Error('PDF.js failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });

  return loadingPromise;
}

/**
 * Result of PDF processing
 */
export interface PDFPage {
  pageNumber: number;
  imageData: ImageData;
  width: number;
  height: number;
}

/**
 * Options for PDF processing
 */
export interface PDFProcessOptions {
  /** Scale factor for rendering (default: 2 for better recognition) */
  scale?: number;
  /** Maximum pages to process (default: 10) */
  maxPages?: number;
  /** Progress callback */
  onProgress?: (current: number, total: number) => void;
}

/**
 * Process a PDF file and extract pages as ImageData
 */
export async function processPDF(
  file: File | ArrayBuffer,
  options: PDFProcessOptions = {}
): Promise<PDFPage[]> {
  const { scale = 2, maxPages = 10, onProgress } = options;

  // Load PDF.js if needed
  await loadPdfJs();
  if (!pdfLib) throw new Error('PDF.js not loaded');

  // Get array buffer
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;

  // Load PDF document
  const pdf = await pdfLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = Math.min(pdf.numPages, maxPages);
  const pages: PDFPage[] = [];

  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  try {
    for (let i = 1; i <= numPages; i++) {
      onProgress?.(i, numPages);

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render page
      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      pages.push({
        pageNumber: i,
        imageData,
        width: canvas.width,
        height: canvas.height,
      });
    }
  } finally {
    pdf.destroy();
  }

  return pages;
}

/**
 * Check if a file is a PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Check if PDF.js is loaded
 */
export function isPdfJsLoaded(): boolean {
  return pdfLib !== null;
}
