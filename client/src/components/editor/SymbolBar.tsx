import React from 'react';

export interface SymbolBarProps {
  onInsertSymbol: (symbol: string) => void;
}

const SYMBOLS = [
  { label: ';', value: ';' },
  { label: '{ }', value: '{\n    \n}' },
  { label: '{', value: '{' },
  { label: '}', value: '}' },
  { label: '(', value: '(' },
  { label: ')', value: ')' },
  { label: '[', value: '[' },
  { label: ']', value: ']' },
  { label: '"', value: '"' },
  { label: "'", value: "'" },
  { label: '=', value: ' = ' },
  { label: '==', value: ' == ' },
  { label: '<', value: '<' },
  { label: '>', value: '>' },
  { label: '+', value: '+' },
  { label: '-', value: '-' },
  { label: '*', value: '*' },
  { label: '/', value: '/' },
  { label: '!', value: '!' },
  { label: '&&', value: ' && ' },
  { label: '||', value: ' || ' },
  { label: 'Tab', value: '    ' },
];

export const SymbolBar: React.FC<SymbolBarProps> = ({ onInsertSymbol }) => {
  return (
    <div className="w-full bg-slate-100 border-y border-border px-2 py-1.5 overflow-x-auto scrollbar-hide flex items-center gap-1.5 select-none z-10">
      {SYMBOLS.map((s, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onInsertSymbol(s.value)}
          className="h-10 min-w-[40px] px-2.5 rounded-btn bg-white border border-border/80 shadow-xs text-text font-mono text-sm font-semibold hover:bg-primary-50 active:bg-primary-light active:text-primary transition-colors shrink-0 flex items-center justify-center active:scale-95"
          tabIndex={-1}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};
