import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal } from 'lucide-react';

export interface InputPanelProps {
  input: string;
  onChangeInput: (value: string) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({ input, onChangeInput }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t border-border bg-white transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-text-secondary select-none transition-colors min-h-[44px]"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span>Standard Input (stdin)</span>
          {input.trim() && (
            <span className="w-2 h-2 rounded-full bg-primary inline-block" title="Has custom input" />
          )}
        </div>
        <div className="flex items-center gap-1 text-text-muted">
          <span>{isExpanded ? 'Hide' : 'Provide Input'}</span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 bg-white border-t border-border animate-slide-up">
          <textarea
            value={input}
            onChange={(e) => onChangeInput(e.target.value)}
            placeholder="Type any program input here (e.g. numbers, words for Scanner or BufferedReader)..."
            rows={3}
            className="w-full p-2.5 rounded-btn border border-border font-mono text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-muted resize-y"
          />
        </div>
      )}
    </div>
  );
};
