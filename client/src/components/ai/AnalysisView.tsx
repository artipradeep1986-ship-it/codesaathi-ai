import React from 'react';
import type { AIAnalysis, AIIssue } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CheckCircle2, AlertCircle, Wrench, Sparkles, HelpCircle } from 'lucide-react';

export interface AnalysisViewProps {
  analysis: AIAnalysis | null;
  onApplyFix: (issue: AIIssue) => void;
  onApplyAllFixes: () => void;
  onClose?: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  analysis,
  onApplyFix,
  onApplyAllFixes,
  onClose,
}) => {
  if (!analysis) {
    return (
      <div className="p-6 text-center text-text-muted">
        No analysis data available. Run or analyze code to inspect issues.
      </div>
    );
  }

  const issues = analysis.issues || [];
  // Separate compiler errors from AI improvement suggestions
  const compilerErrors = issues.filter(
    (i) =>
      i.what_is_wrong.toLowerCase().includes('syntax') ||
      i.what_is_wrong.toLowerCase().includes('error') ||
      i.what_is_wrong.toLowerCase().includes('cannot find') ||
      i.what_is_wrong.toLowerCase().includes('expected')
  );
  const suggestions = issues.filter((i) => !compilerErrors.includes(i));

  const renderIssueCard = (issue: AIIssue, index: number, isError: boolean) => (
    <div
      key={`${issue.line || index}-${issue.problem_code}`}
      className={`rounded-card border p-4 transition-all ${
        isError ? 'bg-error-bg/30 border-error/30' : 'bg-primary-50/40 border-primary/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isError ? 'error' : 'info'} size="sm">
            {isError ? 'Error' : 'Suggestion'}
          </Badge>
          {issue.line && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-text-secondary border border-border">
              Line {issue.line}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant={isError ? 'danger' : 'primary'}
          icon={<Wrench className="w-3.5 h-3.5" />}
          onClick={() => onApplyFix(issue)}
        >
          Apply Fix
        </Button>
      </div>

      {/* Problematic Code snippet */}
      {issue.problem_code && (
        <div className="mb-2">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">
            Problem Code:
          </span>
          <pre className="p-2.5 rounded-btn bg-white border border-border/80 font-mono text-sm text-error overflow-x-auto">
            <code>{issue.problem_code}</code>
          </pre>
        </div>
      )}

      {/* Corrected Code snippet */}
      {issue.corrected_code && (
        <div className="mb-3">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-1">
            Suggested Fix:
          </span>
          <pre className="p-2.5 rounded-btn bg-white border border-success/40 font-mono text-sm text-success overflow-x-auto">
            <code>{issue.corrected_code}</code>
          </pre>
        </div>
      )}

      {/* Explanation text */}
      <div className="space-y-1.5 text-sm">
        <div>
          <span className="font-semibold text-text">What's wrong: </span>
          <span className="text-text-secondary">{issue.what_is_wrong}</span>
        </div>
        {issue.why && (
          <div>
            <span className="font-semibold text-text">Why it matters: </span>
            <span className="text-text-secondary">{issue.why}</span>
          </div>
        )}
        {issue.explanation && (
          <p className="text-xs text-text-muted pt-1 flex items-start gap-1">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
            <span>{issue.explanation}</span>
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Summary Banner */}
      <div
        className={`p-4 rounded-card border flex items-start gap-3 ${
          analysis.has_errors
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-success-bg border-success/30 text-success'
        }`}
      >
        {analysis.has_errors ? (
          <AlertCircle className="w-6 h-6 shrink-0 text-warning mt-0.5" />
        ) : (
          <CheckCircle2 className="w-6 h-6 shrink-0 text-success mt-0.5" />
        )}
        <div className="flex-1">
          <h4 className="font-bold text-base mb-0.5">
            {analysis.has_errors
              ? `Found ${issues.length} item${issues.length > 1 ? 's' : ''} to improve`
              : 'Code looks great!'}
          </h4>
          <p className="text-sm opacity-90 leading-relaxed">{analysis.summary}</p>
        </div>
      </div>

      {/* Compiler Errors Section */}
      {compilerErrors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-error font-semibold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Compiler & Syntax Errors ({compilerErrors.length})</span>
          </div>
          <div className="space-y-3">
            {compilerErrors.map((issue, idx) => renderIssueCard(issue, idx, true))}
          </div>
        </div>
      )}

      {/* AI Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI Code Improvements & Best Practices ({suggestions.length})</span>
          </div>
          <div className="space-y-3">
            {suggestions.map((issue, idx) => renderIssueCard(issue, idx, false))}
          </div>
        </div>
      )}

      {/* Actions */}
      {issues.length > 0 && (
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <Button
            variant="primary"
            fullWidth
            icon={<CheckCircle2 className="w-5 h-5" />}
            onClick={onApplyAllFixes}
          >
            Apply All Fixes ({issues.length})
          </Button>
          {onClose && (
            <Button variant="secondary" fullWidth onClick={onClose}>
              Dismiss
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
