import { describe, it, expect } from 'vitest';
import { isPDF } from '../src/pdf';

describe('PDF utilities', () => {
  describe('isPDF', () => {
    it('should return true for PDF files', () => {
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(isPDF(pdfFile)).toBe(true);
    });

    it('should return true for PDF by extension', () => {
      const pdfFile = new File([''], 'test.pdf', { type: '' });
      expect(isPDF(pdfFile)).toBe(true);
    });

    it('should return false for image files', () => {
      const imageFile = new File([''], 'test.png', { type: 'image/png' });
      expect(isPDF(imageFile)).toBe(false);
    });

    it('should return false for text files', () => {
      const textFile = new File([''], 'test.txt', { type: 'text/plain' });
      expect(isPDF(textFile)).toBe(false);
    });

    it('should be case insensitive for extension', () => {
      const pdfFile = new File([''], 'test.PDF', { type: '' });
      expect(isPDF(pdfFile)).toBe(true);
    });
  });
});
