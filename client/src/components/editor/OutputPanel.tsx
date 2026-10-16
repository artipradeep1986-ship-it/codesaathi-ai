import React from 'react';
import type { ExecutionResult } from '../../types';
import { Badge } from '../ui/Badge';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, X, AlertTriangle } from 'lucide-react';

export interface OutputPanelProps {
  output: ExecutionResult | null;
  isOpen: boolean;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
  onJumpToLine?: (line: number) => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  output,
  isOpen,
  isMinimized,
  onToggleMinimize,
  onClose,
  onJumpToLine,
}) => {
  if (!isOpen || !output) return null;

  const status = output.execution_status;
  const isSuccess = status === 'success';
  const isCompileError = status === 'compilation_error';
  const isRuntimeError = status === 'runtime_error';

  // Parse lines with errors from compile/error output (e.g. "Main.java:5: error:")
  const parseErrorLines = (text: string): Array<{ line: number; message: string }> => {
    const errorList: Array<{ line: number; message: string }> = [];
    const lines = text.split('\n');
    const regex = /(?::|line\s+)(\d+)(?::|\s)/i;

    lines.forEach((l) => {
      const match = l.match(regex);
      if (match && match[1]) {
        const lineNum = parseInt(match[1], 10);
        if (!isNaN(lineNum) && !errorList.some((e) => e.line === lineNum)) {
          errorList.push({ line: lineNum, message: l });
        }
      }
    });

    return errorList;
  };

  const rawErrors = output.compile_output || output.error_output || '';
  const parsedErrors = parseErrorLines(rawErrors);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-border shadow-2xl transition-all duration-300 md:left-64 ${
        isMinimized ? 'h-14' : 'h-[60vh] md:h-[45vh]'
      } flex flex-col`}
    >
      {/* Header Bar */}
      <div className="h-14 px-4 bg-slate-50 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {isSuccess ? (
            <Badge variant="success" icon={<CheckCircle2 className="w-4 h-4" />}>
              Compilation & Run Successful
            </Badge>
          ) : isCompileError ? (
            <Badge variant="error" icon={<XCircle className="w-4 h-4" />}>
              Compilation Error
            </Badge>
          ) : isRuntimeError ? (
            <Badge variant="error" icon={<AlertTriangle className="w-4 h-4" />}>
              Runtime Error
            </Badge>
          ) : (
            <Badge variant="warning" icon={<AlertTriangle className="w-4 h-4" />}>
              {status.toUpperCase()}
            </Badge>
          )}

          {output.execution_time !== undefined && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-text-muted">
              <Clock className="w-3.5 h-3.5" />
              <span>{output.execution_time.toFixed(2)}s</span>
            </span>
          )}
        </div>

        {/* Panel controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMinimize}
            className="p-2 text-text-muted hover:text-text rounded-btn min-h-[40px] min-w-[40px] flex items-center justify-center hover:bg-slate-200 transition-colors"
            title={isMinimized ? 'Expand output' : 'Minimize'}
          >
            {isMinimized ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text rounded-btn min-h-[40px] min-w-[40px] flex items-center justify-center hover:bg-slate-200 transition-colors"
            title="Close output"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body content */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-3 bg-slate-900 text-slate-100">
          {/* Quick error line jump buttons */}
          {parsedErrors.length > 0 && onJumpToLine && (
            <div className="font-sans flex items-center gap-2 flex-wrap pb-2 border-b border-slate-700">
              <span className="text-xs font-semibold text-rose-400">Jump to Error Line:</span>
              {parsedErrors.map((err) => (
                <button
                  key={err.line}
                  onClick={() => onJumpToLine(err.line)}
                  className="px-2 py-0.5 rounded text-xs bg-rose-950 text-rose-200 border border-rose-700 hover:bg-rose-900 active:scale-95 transition-all"
                >
                  Line {err.line}
                </button>
              ))}
            </div>
          )}

          {/* Compilation Output / Errors */}
          {output.compile_output && (
            <div>
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                Compilation Log:
              </span>
              <pre className="whitespace-pre-wrap text-rose-300 font-mono text-xs md:text-sm">
                {output.compile_output}
              </pre>
            </div>
          )}

          {/* Standard Output */}
          {output.output && (
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                Program Output (stdout):
              </span>
              <pre className="whitespace-pre-wrap text-slate-100 font-mono text-xs md:text-sm">
                {output.output}
              </pre>
            </div>
          )}

          {/* Runtime Error / Stderr */}
          {output.error_output && (
            <div>
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                Error Output (stderr):
              </span>
              <pre className="whitespace-pre-wrap text-rose-300 font-mono text-xs md:text-sm">
                {output.error_output}
              </pre>
            </div>
          )}

          {!output.output && !output.error_output && !output.compile_output && (
            <div className="text-slate-400 italic">Program produced no output.</div>
          )}
        </div>
      )}
    </div>
  );
};
