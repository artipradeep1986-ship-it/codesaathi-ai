import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Check, RotateCcw, Play, ArrowRightLeft } from 'lucide-react';

export interface CompareViewProps {
  originalCode: string;
  correctedCode: string;
  onKeepOriginal: () => void;
  onApplyAll: () => void;
  onRunCorrected?: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  originalCode,
  correctedCode,
  onKeepOriginal,
  onApplyAll,
  onRunCorrected,
}) => {
  const [mobileTab, setMobileTab] = useState<'side_by_side' | 'original' | 'corrected' | 'diff'>('diff');

  // Simple diff by line
  const origLines = originalCode.split('\n');
  const corrLines = correctedCode.split('\n');
  const maxLines = Math.max(origLines.length, corrLines.length);

  const diffItems: Array<{
    lineNumber: number;
    orig?: string;
    corr?: string;
    isDifferent: boolean;
  }> = [];

  for (let i = 0; i < maxLines; i++) {
    const orig = origLines[i];
    const corr = corrLines[i];
    diffItems.push({
      lineNumber: i + 1,
      orig,
      corr,
      isDifferent: orig !== corr,
    });
  }

  const diffCount = diffItems.filter((d) => d.isDifferent).length;

  return (
    <div className="space-y-4">
      {/* Header and Mobile Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text text-base">Code Comparison</h3>
          <Badge variant={diffCount > 0 ? 'warning' : 'success'} size="sm">
            {diffCount} change{diffCount === 1 ? '' : 's'}
          </Badge>
        </div>

        {/* Tab Controls for Mobile / Smaller screens */}
        <div className="flex bg-slate-100 p-1 rounded-btn text-xs font-medium w-full sm:w-auto">
          <button
            onClick={() => setMobileTab('diff')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${
              mobileTab === 'diff' ? 'bg-white text-primary shadow-xs' : 'text-text-secondary'
            }`}
          >
            Changes Diff
          </button>
          <button
            onClick={() => setMobileTab('original')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${
              mobileTab === 'original' ? 'bg-white text-primary shadow-xs' : 'text-text-secondary'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => setMobileTab('corrected')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-all ${
              mobileTab === 'corrected' ? 'bg-white text-primary shadow-xs' : 'text-text-secondary'
            }`}
          >
            Corrected
          </button>
        </div>
      </div>

      {/* Main Diff Display */}
      {mobileTab === 'diff' ? (
        <div className="border border-border rounded-btn overflow-hidden bg-white">
          <div className="max-h-[500px] overflow-y-auto font-mono text-xs md:text-sm">
            {diffItems.map((item) => {
              if (!item.isDifferent) {
                return (
                  <div key={item.lineNumber} className="flex hover:bg-slate-50 py-0.5 px-2">
                    <span className="w-10 text-right pr-3 text-text-muted select-none">
                      {item.lineNumber}
                    </span>
                    <span className="text-text-secondary whitespace-pre-wrap">{item.orig || ''}</span>
                  </div>
                );
              }

              return (
                <div key={item.lineNumber} className="border-y border-dashed border-slate-200">
                  {/* Removed line */}
                  {item.orig !== undefined && (
                    <div className="flex bg-error-bg/60 text-error py-1 px-2">
                      <span className="w-10 text-right pr-3 select-none text-error/70 font-semibold">
                        -{item.lineNumber}
                      </span>
                      <span className="whitespace-pre-wrap flex-1">{item.orig}</span>
                    </div>
                  )}
                  {/* Added/Corrected line */}
                  {item.corr !== undefined && (
                    <div className="flex bg-success-bg/80 text-success py-1 px-2 font-medium">
                      <span className="w-10 text-right pr-3 select-none text-success/70 font-semibold">
                        +{item.lineNumber}
                      </span>
                      <span className="whitespace-pre-wrap flex-1">{item.corr}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : mobileTab === 'original' ? (
        <div className="border border-border rounded-btn p-3 bg-slate-900 text-slate-100 font-mono text-sm max-h-[500px] overflow-y-auto">
          <pre>{originalCode}</pre>
        </div>
      ) : (
        <div className="border border-border rounded-btn p-3 bg-slate-900 text-slate-100 font-mono text-sm max-h-[500px] overflow-y-auto">
          <pre>{correctedCode}</pre>
        </div>
      )}

      {/* Side by side display for large screens if desired */}
      <div className="hidden lg:grid grid-cols-2 gap-3 pt-2">
        <div className="border border-border rounded-card p-3 bg-slate-50">
          <h4 className="text-xs font-bold text-text-muted uppercase mb-2">Original Notebook Code</h4>
          <pre className="font-mono text-xs max-h-60 overflow-y-auto p-2 bg-white rounded border border-border">
            {originalCode}
          </pre>
        </div>
        <div className="border border-success/30 rounded-card p-3 bg-success-bg/20">
          <h4 className="text-xs font-bold text-success uppercase mb-2">Corrected Code</h4>
          <pre className="font-mono text-xs max-h-60 overflow-y-auto p-2 bg-white rounded border border-success/30">
            {correctedCode}
          </pre>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
        <Button
          variant="secondary"
          icon={<RotateCcw className="w-4 h-4" />}
          onClick={onKeepOriginal}
          fullWidth
          className="sm:w-auto"
        >
          Keep Original
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="primary"
            icon={<Check className="w-4 h-4" />}
            onClick={onApplyAll}
            fullWidth
            className="sm:w-auto"
          >
            Apply All Changes
          </Button>

          {onRunCorrected && (
            <Button
              variant="secondary"
              icon={<Play className="w-4 h-4 text-success" />}
              onClick={onRunCorrected}
              fullWidth
              className="sm:w-auto"
            >
              Run Corrected
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
