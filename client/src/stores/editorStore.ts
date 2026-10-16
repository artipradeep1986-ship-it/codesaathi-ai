import { create } from 'zustand';
import { api } from '../services/api';
import type { ExecutionResult, AIAnalysis, AIExplanation, AIIssue, ExplanationMode } from '../types';

export const DEFAULT_JAVA_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeSaathi!");
    }
}`;

const LOCAL_STORAGE_DRAFT_KEY = 'codesaathi_editor_draft';

interface EditorState {
  code: string;
  language: string;
  title: string;
  input: string;
  output: ExecutionResult | null;
  isRunning: boolean;
  isAnalyzing: boolean;
  isExplaining: boolean;
  analysis: AIAnalysis | null;
  explanation: AIExplanation | null;
  originalCode: string;
  correctedCode: string;
  programId: string | null;

  setTitle: (title: string) => void;
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;
  setInput: (input: string) => void;
  setOutput: (output: ExecutionResult | null) => void;
  runCode: () => Promise<void>;
  analyzeCode: () => Promise<void>;
  explainCode: (mode: ExplanationMode) => Promise<void>;
  applyFix: (issue: AIIssue) => void;
  applyAllFixes: () => void;
  revertToOriginal: () => void;
  saveProgram: (customTitle?: string, description?: string) => Promise<string>;
  loadProgram: (programId: string) => Promise<void>;
  reset: () => void;
  saveDraftLocally: () => void;
  loadLocalDraft: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  code: DEFAULT_JAVA_CODE,
  language: 'java',
  title: 'Untitled Program',
  input: '',
  output: null,
  isRunning: false,
  isAnalyzing: false,
  isExplaining: false,
  analysis: null,
  explanation: null,
  originalCode: DEFAULT_JAVA_CODE,
  correctedCode: '',
  programId: null,

  setTitle: (title: string) => set({ title }),

  setCode: (code: string) => {
    set({ code });
  },

  setLanguage: (language: string) => {
    set({ language });
  },

  setInput: (input: string) => {
    set({ input });
  },

  setOutput: (output: ExecutionResult | null) => {
    set({ output });
  },

  runCode: async () => {
    const { code, language, input, programId } = get();
    set({ isRunning: true });
    try {
      const result = await api.execute.run({
        code,
        language,
        input,
        program_id: programId || undefined,
      });
      set({ output: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Execution failed';
      set({
        output: {
          execution_status: 'error',
          error_output: msg,
          output: '',
        },
      });
    } finally {
      set({ isRunning: false });
    }
  },

  analyzeCode: async () => {
    const { code, language, output } = get();
    set({ isAnalyzing: true });
    try {
      const errMessage = output?.error_output || output?.compile_output;
      const analysis = await api.ai.analyze({
        code,
        language,
        error_message: errMessage,
      });

      // Compute corrected code preview if issues exist
      let corrected = code;
      if (analysis.issues && analysis.issues.length > 0) {
        for (const issue of analysis.issues) {
          if (issue.problem_code && issue.corrected_code && corrected.includes(issue.problem_code)) {
            corrected = corrected.replace(issue.problem_code, issue.corrected_code);
          }
        }
      }

      set({
        analysis,
        originalCode: code,
        correctedCode: corrected,
      });
    } catch (err) {
      console.error('AI Analysis failed', err);
      throw err;
    } finally {
      set({ isAnalyzing: false });
    }
  },

  explainCode: async (mode: ExplanationMode) => {
    const { code, language } = get();
    set({ isExplaining: true });
    try {
      const explanation = await api.ai.explain({
        code,
        language,
        mode,
      });
      set({ explanation });
    } catch (err) {
      console.error('AI Explanation failed', err);
      throw err;
    } finally {
      set({ isExplaining: false });
    }
  },

  applyFix: (issue: AIIssue) => {
    const { code, analysis } = get();
    if (!issue.problem_code || !issue.corrected_code) return;

    let newCode = code;
    if (code.includes(issue.problem_code)) {
      newCode = code.replace(issue.problem_code, issue.corrected_code);
    } else if (issue.line && issue.line > 0) {
      const lines = code.split('\n');
      if (lines[issue.line - 1] !== undefined) {
        lines[issue.line - 1] = issue.corrected_code;
        newCode = lines.join('\n');
      }
    }

    // Filter out applied issue
    const updatedIssues = analysis?.issues.filter((i) => i !== issue) || [];
    set({
      code: newCode,
      analysis: analysis
        ? {
            ...analysis,
            issues: updatedIssues,
            has_errors: updatedIssues.length > 0,
          }
        : null,
    });
  },

  applyAllFixes: () => {
    const { code, analysis } = get();
    if (!analysis || !analysis.issues.length) return;

    let newCode = code;
    for (const issue of analysis.issues) {
      if (issue.problem_code && issue.corrected_code && newCode.includes(issue.problem_code)) {
        newCode = newCode.replace(issue.problem_code, issue.corrected_code);
      }
    }

    set({
      code: newCode,
      analysis: {
        ...analysis,
        issues: [],
        has_errors: false,
      },
    });
  },

  revertToOriginal: () => {
    const { originalCode } = get();
    if (originalCode) {
      set({ code: originalCode });
    }
  },

  saveProgram: async (customTitle?: string, description?: string) => {
    const { code, language, title, programId, correctedCode } = get();
    const finalTitle = customTitle || title || 'My Java Program';

    if (programId) {
      const updated = await api.programs.update(programId, {
        title: finalTitle,
        programming_language: language,
        source_code: code,
        corrected_code: correctedCode || undefined,
        description: description || undefined,
      });
      set({ title: updated.title });
      return updated.id;
    } else {
      const created = await api.programs.create({
        title: finalTitle,
        programming_language: language,
        source_code: code,
        corrected_code: correctedCode || undefined,
        description: description || undefined,
      });
      set({ programId: created.id, title: created.title });
      return created.id;
    }
  },

  loadProgram: async (id: string) => {
    try {
      const prog = await api.programs.get(id);
      set({
        programId: prog.id,
        title: prog.title,
        code: prog.source_code,
        language: prog.programming_language || 'java',
        originalCode: prog.source_code,
        correctedCode: prog.corrected_code || '',
        output: null,
        analysis: null,
        explanation: null,
      });
    } catch (err) {
      console.error('Failed to load program', err);
      throw err;
    }
  },

  reset: () => {
    set({
      code: DEFAULT_JAVA_CODE,
      language: 'java',
      title: 'Untitled Program',
      input: '',
      output: null,
      isRunning: false,
      isAnalyzing: false,
      isExplaining: false,
      analysis: null,
      explanation: null,
      originalCode: DEFAULT_JAVA_CODE,
      correctedCode: '',
      programId: null,
    });
  },

  saveDraftLocally: () => {
    try {
      const { code, language, title, input, programId } = get();
      const draft = {
        code,
        language,
        title,
        input,
        programId,
        timestamp: Date.now(),
      };
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.warn('Failed to save draft to localStorage', e);
    }
  },

  loadLocalDraft: () => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.code) {
          set({
            code: draft.code,
            language: draft.language || 'java',
            title: draft.title || 'Untitled Program',
            input: draft.input || '',
            programId: draft.programId || null,
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load draft from localStorage', e);
    }
  },
}));
