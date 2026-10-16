import React from 'react';
import type { Program } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Code, Trash2, Calendar, ChevronRight } from 'lucide-react';

export interface ProgramCardProps {
  program: Program;
  onOpen: (program: Program) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({ program, onOpen, onDelete }) => {
  const formattedDate = program.created_at
    ? new Date(program.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  // Extract preview lines from source code
  const codeSnippet = program.source_code
    ? program.source_code.split('\n').slice(0, 3).join('\n')
    : '// No code';

  return (
    <Card
      interactive
      onClick={() => onOpen(program)}
      className="group relative flex flex-col justify-between hover:border-primary/50 transition-all"
    >
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-text text-base group-hover:text-primary transition-colors line-clamp-1">
              {program.title || 'Untitled Program'}
            </h3>
            <Badge variant="info" size="sm">
              {program.programming_language?.toUpperCase() || 'JAVA'}
            </Badge>
          </div>

          <button
            type="button"
            onClick={(e) => onDelete(program.id, e)}
            className="p-1.5 text-text-muted hover:text-error hover:bg-error-bg/50 rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center -mr-1 -mt-1"
            title="Delete program"
            aria-label="Delete program"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Code snippet preview */}
        <pre className="p-2.5 rounded-btn bg-slate-900 text-slate-200 font-mono text-xs overflow-hidden max-h-20 mb-3 select-none">
          <code>{codeSnippet}</code>
        </pre>
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center gap-1 text-primary font-medium group-hover:translate-x-0.5 transition-transform">
          <span>Open</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Card>
  );
};
