import React from 'react';
import type { ScannerPage } from '../../stores/scannerStore';
import { Button } from '../ui/Button';
import { ArrowLeft, ArrowRight, Trash2, Eye, Plus, AlertTriangle } from 'lucide-react';

export interface PageManagerProps {
  pages: ScannerPage[];
  onRemovePage: (id: string) => void;
  onReorderPage: (from: number, to: number) => void;
  onSelectPreview: (page: ScannerPage) => void;
  onAddMore: () => void;
  isProcessing?: boolean;
}

export const PageManager: React.FC<PageManagerProps> = ({
  pages,
  onRemovePage,
  onReorderPage,
  onSelectPreview,
  onAddMore,
  isProcessing = false,
}) => {
  if (pages.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-text">
          Scanned Pages ({pages.length})
        </h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={onAddMore}
          disabled={isProcessing}
        >
          Add Page
        </Button>
      </div>

      {/* Horizontal scrollable thumbnails */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide pt-1">
        {pages.map((page, index) => {
          // Warning check: if image file size is very small, might be blurry or thumbnail
          const isSmall = page.file.size < 40 * 1024; // < 40KB

          return (
            <div
              key={page.id}
              className="relative shrink-0 w-32 md:w-36 bg-white border border-border rounded-btn p-1.5 shadow-sm flex flex-col group"
            >
              {/* Badge for page number */}
              <div className="absolute top-2 left-2 z-10 bg-primary/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                Page {page.pageNumber}
              </div>

              {/* Quality alert if file is suspiciously small */}
              {isSmall && (
                <div
                  className="absolute top-2 right-2 z-10 bg-amber-500 text-white p-1 rounded-full shadow"
                  title="Low resolution image. Might affect OCR quality."
                >
                  <AlertTriangle className="w-3 h-3" />
                </div>
              )}

              {/* Thumbnail click opens preview */}
              <div
                onClick={() => onSelectPreview(page)}
                className="h-36 w-full rounded-md overflow-hidden bg-slate-100 cursor-pointer relative group-hover:opacity-90 transition-opacity"
              >
                <img
                  src={page.preview}
                  alt={`Page ${page.pageNumber}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="w-5 h-5 text-white drop-shadow" />
                </div>
              </div>

              {/* Controls bar */}
              <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-border/40">
                {/* Move Left / Previous */}
                <button
                  type="button"
                  disabled={index === 0 || isProcessing}
                  onClick={() => onReorderPage(index, index - 1)}
                  className="p-1 text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move earlier"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => onRemovePage(page.id)}
                  className="p-1 text-text-muted hover:text-error disabled:opacity-30"
                  title="Delete page"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Move Right / Next */}
                <button
                  type="button"
                  disabled={index === pages.length - 1 || isProcessing}
                  onClick={() => onReorderPage(index, index + 1)}
                  className="p-1 text-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move later"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
