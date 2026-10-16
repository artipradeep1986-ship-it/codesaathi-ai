import React, { useState, useEffect } from 'react';
import type { AIExplanation, ExplanationMode } from '../../types';
import { Chip } from '../ui/Chip';
import { Volume2, VolumeX, Copy, Check, Sparkles, BookOpen, Lightbulb, PlayCircle } from 'lucide-react';
import { toast } from '../ui/Toast';

export interface ExplanationViewProps {
  explanation: AIExplanation | null;
  currentMode: ExplanationMode;
  onSelectMode: (mode: ExplanationMode) => void;
  isLoading?: boolean;
}

const MODES: Array<{ id: ExplanationMode; label: string; icon?: string }> = [
  { id: 'simple_english', label: 'Simple English' },
  { id: 'hinglish', label: 'Hinglish' },
  { id: 'hindi', label: 'Hindi' },
  { id: 'line_by_line', label: 'Line by Line' },
  { id: 'logic', label: 'Logic / Flow' },
  { id: 'output', label: 'Dry Run' },
  { id: 'keywords', label: 'Keywords' },
  { id: 'exam', label: 'Board Exam Tips' },
];

export const ExplanationView: React.FC<ExplanationViewProps> = ({
  explanation,
  currentMode,
  onSelectMode,
  isLoading = false,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Stop speech if unmounting or switching modes
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentMode]);

  const getFullExplanationText = (): string => {
    if (!explanation) return '';
    if (explanation.explanation) return explanation.explanation;
    const parts = [
      explanation.title || '',
      explanation.overview || '',
      ...(explanation.sections || []).map((s) => `${s.title}:\n${s.content}`),
      ...(explanation.key_takeaways || []).map((k) => `Exam Tip: ${k}`),
    ];
    return parts.filter(Boolean).join('\n\n');
  };

  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const fullText = getFullExplanationText();
      if (!fullText) return;
      window.speechSynthesis.cancel();

      // Clean markdown code blocks from speech
      const textToRead = fullText.replace(/```[\s\S]*?```/g, 'code snippet omitted');
      const utterance = new SpeechSynthesisUtterance(textToRead);

      if (currentMode === 'hindi') {
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-IN';
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = () => {
    const fullText = getFullExplanationText();
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('Explanation copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render markdown-like text with formatting and inline code blocks
  const renderFormattedText = (raw?: string) => {
    if (!raw) return null;
    const parts = raw.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const maybeLang = lines[0]?.trim();
        const codeContent =
          maybeLang && ['java', 'python', 'cpp', 'js', 'javascript'].includes(maybeLang)
            ? lines.slice(1).join('\n')
            : lines.join('\n');

        return (
          <pre
            key={index}
            className="my-3 p-3.5 bg-slate-900 text-slate-100 rounded-btn font-mono text-sm overflow-x-auto shadow-inner"
          >
            <code>{codeContent}</code>
          </pre>
        );
      }

      // Regular paragraphs
      const paragraphs = part.split('\n\n');
      return (
        <div key={index} className="space-y-2.5">
          {paragraphs.map((p, pIdx) => {
            const cleanP = p.trim();
            if (!cleanP) return null;
            if (cleanP.startsWith('## ')) {
              return (
                <h3 key={pIdx} className="font-bold text-text text-base mt-2 mb-1">
                  {cleanP.replace(/^##\s+/, '')}
                </h3>
              );
            }
            if (cleanP.startsWith('### ')) {
              return (
                <h4 key={pIdx} className="font-semibold text-primary text-sm mt-3 mb-1">
                  {cleanP.replace(/^###\s+/, '')}
                </h4>
              );
            }
            return (
              <p key={pIdx} className="text-text-secondary leading-relaxed text-sm md:text-base">
                {cleanP}
              </p>
            );
          })}
        </div>
      );
    });
  };

  const hasRichSections = explanation?.sections && explanation.sections.length > 0;

  return (
    <div className="space-y-4">
      {/* Mode Selector Chips */}
      <div>
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Choose Explanation Style</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
          {MODES.map((mode) => (
            <Chip
              key={mode.id}
              label={mode.label}
              active={currentMode === mode.id}
              onClick={() => onSelectMode(mode.id)}
            />
          ))}
        </div>
      </div>

      {/* Explanation Card */}
      <div className="bg-surface-soft border border-border/70 rounded-card p-4 md:p-5 relative">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text text-sm">
              {MODES.find((m) => m.id === currentMode)?.label} Explanation
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleSpeak}
              disabled={isLoading || !explanation}
              className={`p-2 rounded-btn transition-colors ${
                isSpeaking
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text hover:bg-white'
              }`}
              title={isSpeaking ? 'Stop speech' : 'Listen with Audio'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleCopy}
              disabled={isLoading || !explanation}
              className="p-2 text-text-secondary hover:text-text hover:bg-white rounded-btn transition-colors"
              title="Copy text"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Content area */}
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="font-semibold text-text text-sm">Preparing Your Lesson...</p>
              <p className="text-xs text-text-muted">
                Explaining concepts in {MODES.find((m) => m.id === currentMode)?.label} mode
              </p>
            </div>
          </div>
        ) : explanation ? (
          <div className="space-y-4">
            {/* Title & Overview */}
            {explanation.title && (
              <div>
                <h3 className="font-bold text-base md:text-lg text-text">
                  {explanation.title}
                </h3>
              </div>
            )}

            {explanation.overview && (
              <div className="p-3.5 bg-primary-50/60 border border-primary/20 rounded-btn text-text-secondary text-sm md:text-base leading-relaxed">
                {explanation.overview}
              </div>
            )}

            {/* Rich Sections */}
            {hasRichSections ? (
              <div className="space-y-3 pt-1">
                {explanation.sections!.map((section, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3.5 bg-white border border-border/80 rounded-card shadow-2xs space-y-2"
                  >
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>{section.title}</span>
                    </div>

                    <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
                      {section.content}
                    </p>

                    {section.code_snippet && (
                      <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-btn font-mono text-xs overflow-x-auto">
                        <code>{section.code_snippet}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Fallback to formatted markdown text
              explanation.explanation && (
                <div className="prose prose-sm max-w-none text-text-secondary">
                  {renderFormattedText(explanation.explanation)}
                </div>
              )
            )}

            {/* Dry Run Steps if available */}
            {explanation.dry_run && explanation.dry_run.length > 0 && (
              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-card space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                  <PlayCircle className="w-4 h-4 shrink-0" />
                  <span>Dry Run Tracing</span>
                </div>
                <div className="space-y-2">
                  {explanation.dry_run.map((step) => (
                    <div
                      key={step.step}
                      className="text-xs bg-white p-2.5 rounded border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                    >
                      <span className="font-semibold text-text">Step {step.step}: {step.explanation}</span>
                      {step.variables && Object.keys(step.variables).length > 0 && (
                        <span className="font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          {JSON.stringify(step.variables)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Takeaways */}
            {explanation.key_takeaways && explanation.key_takeaways.length > 0 && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-card space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span>Exam Tips & Key Points</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-emerald-950">
                  {explanation.key_takeaways.map((point, kIdx) => (
                    <li key={kIdx} className="leading-relaxed">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-text-muted text-sm space-y-1">
            <p>Select any style above to get an instant explanation from CodeSaathi AI.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplanationView;
