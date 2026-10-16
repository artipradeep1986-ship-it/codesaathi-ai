import { create } from 'zustand';
import { api } from '../services/api';
import type { OCRResult } from '../types';

export interface ScannerPage {
  id: string;
  file: File;
  preview: string;
  pageNumber: number;
}

interface ScannerState {
  pages: ScannerPage[];
  ocrResult: OCRResult | null;
  isProcessing: boolean;
  processingStatus: string;
  error: string | null;
  addPages: (files: File[]) => void;
  removePage: (id: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  processOCR: () => Promise<void>;
  clearAll: () => void;
  setOCRResult: (result: OCRResult) => void;
  updateLine: (lineNumber: number, newText: string) => void;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
  pages: [],
  ocrResult: null,
  isProcessing: false,
  processingStatus: '',
  error: null,

  addPages: (newFiles: File[]) => {
    const currentPages = get().pages;
    const startIndex = currentPages.length;

    const newPages: ScannerPage[] = newFiles.map((file, idx) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      pageNumber: startIndex + idx + 1,
    }));

    set({
      pages: [...currentPages, ...newPages],
      error: null,
    });
  },

  removePage: (id: string) => {
    const currentPages = get().pages;
    const pageToRemove = currentPages.find((p) => p.id === id);
    if (pageToRemove) {
      URL.revokeObjectURL(pageToRemove.preview);
    }
    const filtered = currentPages.filter((p) => p.id !== id);
    const reindexed = filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    set({ pages: reindexed });
  },

  reorderPages: (fromIndex: number, toIndex: number) => {
    const currentPages = [...get().pages];
    if (fromIndex < 0 || fromIndex >= currentPages.length || toIndex < 0 || toIndex >= currentPages.length) {
      return;
    }
    const [moved] = currentPages.splice(fromIndex, 1);
    currentPages.splice(toIndex, 0, moved);
    const reindexed = currentPages.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    set({ pages: reindexed });
  },

  processOCR: async () => {
    const { pages } = get();
    if (!pages.length) {
      set({ error: 'Please add at least one page photo before processing.' });
      return;
    }

    set({ isProcessing: true, error: null, processingStatus: `Reading page 1 of ${pages.length}...` });

    try {
      const files = pages.map((p) => p.file);
      // In realistic flow, status update could progress
      set({ processingStatus: 'Extracting handwritten code with AI...' });
      const result = await api.ocr.process(files);
      set({
        ocrResult: result,
        processingStatus: 'OCR Completed successfully!',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to recognize code from images';
      set({ error: msg, processingStatus: '' });
      throw err;
    } finally {
      set({ isProcessing: false });
    }
  },

  clearAll: () => {
    const { pages } = get();
    pages.forEach((p) => URL.revokeObjectURL(p.preview));
    set({
      pages: [],
      ocrResult: null,
      isProcessing: false,
      processingStatus: '',
      error: null,
    });
  },

  setOCRResult: (result: OCRResult) => {
    set({ ocrResult: result });
  },

  updateLine: (lineNumber: number, newText: string) => {
    const { ocrResult } = get();
    if (!ocrResult) return;

    const updatedLines = ocrResult.lines.map((l) =>
      l.line_number === lineNumber ? { ...l, text: newText, confidence: 1.0 } : l
    );

    const updatedCode = updatedLines.map((l) => l.text).join('\n');

    set({
      ocrResult: {
        ...ocrResult,
        lines: updatedLines,
        code: updatedCode,
      },
    });
  },
}));
