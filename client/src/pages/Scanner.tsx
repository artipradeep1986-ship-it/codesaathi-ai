import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScannerStore, type ScannerPage } from '../stores/scannerStore';
import { useEditorStore } from '../stores/editorStore';
import { ImageCapture } from '../components/scanner/ImageCapture';
import { PageManager } from '../components/scanner/PageManager';
import { ImagePreview } from '../components/scanner/ImagePreview';
import { OCRReview } from '../components/scanner/OCRReview';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { toast } from '../components/ui/Toast';
import { Sparkles, Camera, CheckSquare, Edit3, Play, AlertCircle } from 'lucide-react';

export const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const {
    pages,
    ocrResult,
    isProcessing,
    processingStatus,
    error,
    addPages,
    removePage,
    reorderPages,
    processOCR,
    updateLine,
    clearAll,
  } = useScannerStore();

  const setEditorCode = useEditorStore((state) => state.setCode);
  const setTitle = useEditorStore((state) => state.setTitle);

  const [activeStep, setActiveStep] = useState<1 | 2>(ocrResult ? 2 : 1);
  const [selectedPreviewPage, setSelectedPreviewPage] = useState<ScannerPage | null>(null);

  const steps = [
    { number: 1, title: 'Photos', icon: Camera },
    { number: 2, title: 'Check Text', icon: CheckSquare },
    { number: 3, title: 'Edit & Run', icon: Play },
  ];

  const handleProcessPhotos = async () => {
    if (pages.length === 0) {
      toast.error('Please add at least one page photo first.');
      return;
    }

    try {
      await processOCR();
      setActiveStep(2);
      toast.success('Handwritten code extracted successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OCR processing failed';
      toast.error(msg);
    }
  };

  const handleContinueToEditor = () => {
    if (!ocrResult) return;
    setEditorCode(ocrResult.code);
    setTitle(`Scanned Notebook Program (${new Date().toLocaleDateString()})`);
    useEditorStore.getState().saveDraftLocally();
    navigate('/editor');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Step Indicator Header */}
      <div className="bg-white rounded-card p-4 border border-border shadow-xs">
        <div className="grid grid-cols-3 gap-2">
          {steps.map((st) => {
            const Icon = st.icon;
            const isCurrent = activeStep === st.number;
            const isCompleted = activeStep > st.number;

            return (
              <div
                key={st.number}
                className={`flex items-center gap-2.5 p-2 rounded-btn transition-colors ${
                  isCurrent
                    ? 'bg-primary-50 text-primary font-bold'
                    : isCompleted
                    ? 'text-success font-medium'
                    : 'text-text-muted'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-primary text-white'
                      : isCompleted
                      ? 'bg-success text-white'
                      : 'bg-slate-100 text-text-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-xs">
                  <div className="uppercase tracking-wider text-[10px]">Step {st.number}</div>
                  <div className="truncate">{st.title}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Capture & Arrange Photos */}
      {activeStep === 1 && (
        <div className="space-y-5">
          <div className="bg-primary-50/70 border border-primary/20 rounded-card p-4">
            <h2 className="font-bold text-base text-primary mb-1">
              📸 Photograph Notebook Pages
            </h2>
            <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
              Capture clear, well-lit photos of your handwritten computer practical. If your program spans across multiple pages, add them in order.
            </p>
          </div>

          {/* Capture controls */}
          <ImageCapture onAddImages={addPages} disabled={isProcessing} />

          {/* Thumbnail Manager */}
          <PageManager
            pages={pages}
            onRemovePage={removePage}
            onReorderPage={reorderPages}
            onSelectPreview={(page) => setSelectedPreviewPage(page)}
            onAddMore={() => {
              const fileInput = document.getElementById('dropzone-file-input');
              fileInput?.click();
            }}
            isProcessing={isProcessing}
          />

          {/* Processing Status Banner */}
          {isProcessing && (
            <div className="p-4 rounded-card bg-primary-50 border border-primary/30 space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>{processingStatus || 'Analyzing handwriting...'}</span>
              </div>
              <ProgressBar progress={65} showPercentage={false} />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-btn bg-error-bg text-error text-xs font-medium border border-error/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Footer */}
          {pages.length > 0 && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                variant="secondary"
                onClick={clearAll}
                disabled={isProcessing}
                fullWidth
                className="sm:w-auto"
              >
                Clear All
              </Button>

              <Button
                variant="primary"
                size="lg"
                loading={isProcessing}
                onClick={handleProcessPhotos}
                fullWidth
                className="sm:w-auto shadow-sm"
                icon={<Sparkles className="w-5 h-5" />}
              >
                Process {pages.length} Photo{pages.length > 1 ? 's' : ''} with AI
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Check Text (OCR Review) */}
      {activeStep === 2 && ocrResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveStep(1)}
              icon={<Camera className="w-4 h-4" />}
            >
              Back to Photos
            </Button>
          </div>

          <OCRReview
            ocrResult={ocrResult}
            pages={pages}
            onLineChange={updateLine}
            onContinue={handleContinueToEditor}
          />
        </div>
      )}

      {/* Full preview modal */}
      <ImagePreview
        page={selectedPreviewPage}
        onClose={() => setSelectedPreviewPage(null)}
        onDelete={removePage}
      />
    </div>
  );
};
