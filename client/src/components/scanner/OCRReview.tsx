import React, { useState } from 'react';
import type { OCRResult, OCRLine } from '../../types';
import type { ScannerPage } from '../../stores/scannerStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AlertTriangle, Check, ArrowRight, Eye, Code, SplitSquareVertical } from 'lucide-react';

export interface OCRReviewProps {
  ocrResult: OCRResult;
  pages: ScannerPage[];
  onLineChange: (lineNumber: number, text: string) => void;
  onContinue: () => void;
}

export const OCRReview: React.FC<OCRReviewProps> = ({
  ocrResult,
  pages,
  onLineChange,
  onContinue,
}) => {
  const [activeTab, setActiveTab] = useState<'side_by_side' | 'code' | 'photo'>('code');
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [editingLineNumber, setEditingLineNumber] = useState<number | null>(null);
  const [editLineText, setEditLineText] = useState('');

  const uncertainCount = ocrResult.lines.filter((l) => l.confidence < 0.85).length;

  const handleStartEditLine = (line: OCRLine) => {
    setEditingLineNumber(line.line_number);
    setEditLineText(line.text);
  };

  const handleSaveLine = (lineNumber: number) => {
    onLineChange(lineNumber, editLineText);
    setEditingLineNumber(null);
  };

  const handleApplySuggestion = (lineNumber: number, suggestion: string) => {
    onLineChange(lineNumber, suggestion);
    setEditingLineNumber(null);
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h3 className="font-semibold text-text text-base">Check Recognized Code</h3>
          <p className="text-xs text-text-muted">
            Review handwritten text recognition before sending to editor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {uncertainCount > 0 ? (
            <Badge variant="warning" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
              {uncertainCount} uncertain line{uncertainCount === 1 ? '' : 's'}
            </Badge>
          ) : (
            <Badge variant="success" icon={<Check className="w-3.5 h-3.5" />}>
              High accuracy ({Math.round(ocrResult.overall_confidence * 100)}%)
            </Badge>
          )}

          {/* View Tab Buttons */}
          <div className="flex bg-slate-100 p-0.5 rounded-btn text-xs font-medium">
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md ${
                activeTab === 'code' ? 'bg-white text-primary shadow-xs' : 'text-text-secondary'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Code</span>
            </button>
            <button
              onClick={() => setActiveTab('photo')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md ${
                activeTab === 'photo' ? 'bg-white text-primary shadow-xs' : 'text-text-secondary'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Photo</span>
            </button>
            <button
              onClick={() => setActiveTab('side_by_side')}
              className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-md ${
                activeTab === 'side_by_side' ? 'bg-white text-primary shadow-xs' : 'text-text-secondary'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Review Body */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Photo view (when active or in side_by_side mode) */}
        {(activeTab === 'photo' || activeTab === 'side_by_side') && (
          <div className="border border-border rounded-card p-3 bg-slate-900 text-white flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-300">
                Original Photo (Page {activePageIndex + 1} of {pages.length})
              </span>
              {pages.length > 1 && (
                <div className="flex gap-1">
                  {pages.map((_, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => setActivePageIndex(pIdx)}
                      className={`text-xs px-2 py-0.5 rounded ${
                        activePageIndex === pIdx ? 'bg-primary text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      P{pIdx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {pages[activePageIndex] ? (
              <img
                src={pages[activePageIndex].preview}
                alt="Original page"
                className="max-h-[460px] w-auto object-contain rounded"
              />
            ) : (
              <div className="py-20 text-text-muted text-sm">No photo available</div>
            )}
          </div>
        )}

        {/* Code line by line reviewer */}
        {(activeTab === 'code' || activeTab === 'side_by_side') && (
          <div
            className={`border border-border rounded-card bg-white p-3 flex flex-col ${
              activeTab === 'code' ? 'md:col-span-2' : ''
            }`}
          >
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Extracted Code Lines</span>
              <span className="text-[11px] normal-case text-text-muted">Tap any line to edit</span>
            </div>

            <div className="max-h-[460px] overflow-y-auto space-y-1 font-mono text-xs md:text-sm pr-1">
              {ocrResult.lines.map((line) => {
                const isUncertain = line.confidence < 0.85;
                const isEditing = editingLineNumber === line.line_number;

                if (isEditing) {
                  return (
                    <div
                      key={line.line_number}
                      className="p-2 bg-primary-50 border border-primary rounded-btn space-y-2 animate-fade-in"
                    >
                      <div className="flex items-center justify-between text-xs font-sans text-primary">
                        <span>Editing Line {line.line_number}</span>
                      </div>
                      <input
                        type="text"
                        value={editLineText}
                        onChange={(e) => setEditLineText(e.target.value)}
                        autoFocus
                        className="w-full px-2.5 py-1.5 rounded border border-primary/50 text-text bg-white font-mono text-sm"
                      />

                      {/* Alternatives / suggestions if available */}
                      {line.uncertain_chars && line.uncertain_chars.length > 0 && (
                        <div className="text-xs font-sans text-text-secondary">
                          <span className="font-medium">Suggestions: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {line.uncertain_chars.map((uc, ucIdx) =>
                              uc.alternatives.map((alt, aIdx) => (
                                <button
                                  key={`${ucIdx}-${aIdx}`}
                                  type="button"
                                  onClick={() => {
                                    const rep =
                                      editLineText.slice(0, uc.position) +
                                      alt +
                                      editLineText.slice(uc.position + 1);
                                    handleApplySuggestion(line.line_number, rep);
                                  }}
                                  className="px-2 py-0.5 rounded bg-white border border-border text-xs hover:border-primary"
                                >
                                  Replace '{uc.char}' with '{alt}'
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-1 font-sans">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingLineNumber(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleSaveLine(line.line_number)}
                        >
                          Save Line
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={line.line_number}
                    onClick={() => handleStartEditLine(line)}
                    className={`flex items-start gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                      isUncertain
                        ? 'bg-amber-50 hover:bg-amber-100/70 border border-amber-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-8 text-right shrink-0 text-text-muted select-none text-xs pt-0.5">
                      {line.line_number}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-all text-text">
                      {line.text || ' '}
                    </span>
                    {isUncertain && (
                      <span className="text-[10px] font-sans font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> Check
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation & Bottom Action */}
      <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
          <span className="text-sm font-medium text-text">
            I checked the code lines and verified handwritten text ✓
          </span>
        </label>

        <Button
          variant="primary"
          size="lg"
          disabled={!isConfirmed}
          icon={<ArrowRight className="w-5 h-5" />}
          iconPosition="right"
          onClick={onContinue}
          fullWidth
          className="sm:w-auto"
        >
          Continue to Editor
        </Button>
      </div>
    </div>
  );
};
