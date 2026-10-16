import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { useEditorStore, DEFAULT_JAVA_CODE } from '../stores/editorStore';
import { SymbolBar } from '../components/editor/SymbolBar';
import { InputPanel } from '../components/editor/InputPanel';
import { OutputPanel } from '../components/editor/OutputPanel';
import { AnalysisView } from '../components/ai/AnalysisView';
import { ExplanationView } from '../components/ai/ExplanationView';
import { CompareView } from '../components/ai/CompareView';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { toast } from '../components/ui/Toast';
import {
  Play,
  Sparkles,
  HelpCircle,
  Save,
  RotateCcw,
  Type,
  ArrowRightLeft,
} from 'lucide-react';
import type { ExplanationMode, AIIssue } from '../types';

export const CodeEditor: React.FC = () => {
  const { programId: routeProgramId } = useParams<{ programId?: string }>();
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  const {
    code,
    language,
    title,
    input,
    output,
    isRunning,
    isAnalyzing,
    isExplaining,
    analysis,
    explanation,
    originalCode,
    correctedCode,
    setCode,
    setLanguage,
    setTitle,
    setInput,
    runCode,
    analyzeCode,
    explainCode,
    applyFix,
    applyAllFixes,
    revertToOriginal,
    saveProgram,
    loadProgram,
    saveDraftLocally,
    loadLocalDraft,
  } = useEditorStore();

  const [fontSize, setFontSize] = useState<number>(14);
  const [isOutputOpen, setIsOutputOpen] = useState(false);
  const [isOutputMinimized, setIsOutputMinimized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modals for AI tools
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [explanationMode, setExplanationMode] = useState<ExplanationMode>('simple_english');

  // Load program if route param exists, or restore local draft
  useEffect(() => {
    if (routeProgramId) {
      loadProgram(routeProgramId).catch((err) => {
        toast.error('Failed to load program: ' + err.message);
      });
    } else {
      const currentCode = useEditorStore.getState().code;
      if (!currentCode || currentCode === DEFAULT_JAVA_CODE) {
        loadLocalDraft();
      }
    }
  }, [routeProgramId]);

  // Auto-save draft to localStorage every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      saveDraftLocally();
    }, 10000);
    return () => clearInterval(timer);
  }, [saveDraftLocally]);

  // Handle symbol insertion
  const handleInsertSymbol = (symbol: string) => {
    const view = editorRef.current?.view;
    if (!view) {
      setCode(code + symbol);
      return;
    }

    const { state } = view;
    const from = state.selection.main.from;
    const to = state.selection.main.to;

    view.dispatch({
      changes: { from, to, insert: symbol },
      selection: { anchor: from + symbol.length },
    });
    view.focus();
  };

  // Jump cursor to error line
  const handleJumpToLine = (lineNumber: number) => {
    const view = editorRef.current?.view;
    if (!view) return;

    try {
      const line = view.state.doc.line(Math.min(lineNumber, view.state.doc.lines));
      view.dispatch({
        selection: { anchor: line.from },
        scrollIntoView: true,
      });
      view.focus();
    } catch (e) {
      console.warn('Line jump failed', e);
    }
  };

  const handleRun = async () => {
    setIsOutputOpen(true);
    setIsOutputMinimized(false);
    try {
      await runCode();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Execution error';
      toast.error(msg);
    }
  };

  const handleAnalyze = async () => {
    try {
      await analyzeCode();
      setShowAnalysisModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI analysis failed';
      toast.error(msg);
    }
  };

  const handleExplain = async (mode: ExplanationMode = explanationMode) => {
    setExplanationMode(mode);
    setShowExplanationModal(true);
    try {
      await explainCode(mode);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI explanation failed';
      toast.error(msg);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProgram();
      toast.success('Program saved to your library!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Choose CodeMirror language extension
  const getLanguageExtension = () => {
    switch (language) {
      case 'python':
        return [python()];
      case 'cpp':
        return [cpp()];
      case 'java':
      default:
        return [java()];
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-white border border-border rounded-card overflow-hidden shadow-sm animate-fade-in relative">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 bg-slate-50 border-b border-border gap-2 shrink-0">
        {/* Title & Language */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-bold text-sm md:text-base text-text bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:bg-white px-1.5 py-0.5 rounded outline-none max-w-[160px] sm:max-w-xs truncate"
            title="Edit program title"
          />

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-xs font-semibold uppercase bg-white border border-border rounded-btn px-2 py-1 text-primary cursor-pointer hover:border-primary focus:outline-none"
          >
            <option value="java">JAVA</option>
            <option value="python">PYTHON</option>
            <option value="cpp">C++</option>
          </select>
        </div>

        {/* Font size & Save button */}
        <div className="flex items-center gap-2">
          {/* Compare changes button if correctedCode exists */}
          {correctedCode && correctedCode !== code && (
            <button
              onClick={() => setShowCompareModal(true)}
              className="hidden sm:flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-amber-50 text-amber-700 border border-amber-300 rounded-btn hover:bg-amber-100"
              title="Compare Original vs Corrected Code"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Diff</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 text-text-muted bg-white border border-border px-2 py-1 rounded-btn text-xs">
            <Type className="w-3 h-3" />
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              className="px-1 font-bold hover:text-text"
            >
              -
            </button>
            <span className="font-mono text-text text-[11px]">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(22, fontSize + 1))}
              className="px-1 font-bold hover:text-text"
            >
              +
            </button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            loading={isSaving}
            icon={<Save className="w-4 h-4 text-primary" />}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-auto bg-slate-950 font-mono text-white relative">
        <CodeMirror
          ref={editorRef}
          value={code}
          theme="dark"
          extensions={getLanguageExtension()}
          onChange={(val) => setCode(val)}
          style={{ fontSize: `${fontSize}px` }}
          height="100%"
          className="h-full"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </div>

      {/* Mobile Keyboard Symbol Bar */}
      <SymbolBar onInsertSymbol={handleInsertSymbol} />

      {/* Stdin Collapsible Panel */}
      <InputPanel input={input} onChangeInput={setInput} />

      {/* Bottom Sticky Action Bar */}
      <div className="p-2.5 bg-white border-t border-border flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 flex-1">
          <Button
            variant="primary"
            size="md"
            icon={<Play className="w-5 h-5 fill-current" />}
            loading={isRunning}
            onClick={handleRun}
            className="flex-1 max-w-[150px] shadow-sm"
          >
            Run
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={<Sparkles className="w-4 h-4 text-amber-500" />}
            loading={isAnalyzing}
            onClick={handleAnalyze}
            className="flex-1"
          >
            Find Mistakes
          </Button>

          <Button
            variant="ghost"
            size="md"
            icon={<HelpCircle className="w-4 h-4" />}
            loading={isExplaining}
            onClick={() => handleExplain(explanationMode)}
            className="hidden sm:inline-flex"
          >
            Explain
          </Button>
        </div>

        {/* Explain mobile button */}
        <button
          onClick={() => handleExplain(explanationMode)}
          disabled={isExplaining}
          className="sm:hidden p-2 text-primary hover:bg-primary-50 rounded-btn min-h-[48px] min-w-[48px] flex items-center justify-center border border-border"
          title="Explain Code"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Output Panel Drawer */}
      <OutputPanel
        output={output}
        isOpen={isOutputOpen}
        isMinimized={isOutputMinimized}
        onToggleMinimize={() => setIsOutputMinimized(!isOutputMinimized)}
        onClose={() => setIsOutputOpen(false)}
        onJumpToLine={handleJumpToLine}
      />

      {/* Analysis Modal */}
      <Modal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        maxWidth="lg"
        title="AI Code Analysis & Fixes"
      >
        <AnalysisView
          analysis={analysis}
          onApplyFix={(issue: AIIssue) => {
            applyFix(issue);
            toast.success('Fix applied to your code!');
          }}
          onApplyAllFixes={() => {
            applyAllFixes();
            toast.success('All fixes applied!');
            setShowAnalysisModal(false);
          }}
          onClose={() => setShowAnalysisModal(false)}
        />
      </Modal>

      {/* Explanation Modal */}
      <Modal
        isOpen={showExplanationModal}
        onClose={() => setShowExplanationModal(false)}
        maxWidth="lg"
        title="CodeSaathi AI Tutor"
      >
        <ExplanationView
          explanation={explanation}
          currentMode={explanationMode}
          onSelectMode={(mode) => handleExplain(mode)}
          isLoading={isExplaining}
        />
      </Modal>

      {/* Compare Modal */}
      <Modal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        maxWidth="xl"
        title="Compare Notebook Code vs Corrected"
      >
        <CompareView
          originalCode={originalCode}
          correctedCode={correctedCode}
          onKeepOriginal={() => {
            revertToOriginal();
            setShowCompareModal(false);
            toast.success('Restored original notebook code');
          }}
          onApplyAll={() => {
            setCode(correctedCode);
            setShowCompareModal(false);
            toast.success('Applied corrected code to editor');
          }}
          onRunCorrected={async () => {
            setCode(correctedCode);
            setShowCompareModal(false);
            await handleRun();
          }}
        />
      </Modal>
    </div>
  );
};
export default CodeEditor;
