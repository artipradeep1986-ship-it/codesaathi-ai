export interface StudentProfile {
  id: string;
  display_name: string;
  class_level: number;
  education_board: 'ICSE' | 'CBSE' | 'State Board' | 'Other';
  state_board?: string;
  subject?: string;
  preferred_language: 'english' | 'hindi' | 'hinglish';
  programming_level: 'beginner' | 'intermediate' | 'advanced';
  theme?: string;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Program {
  id: string;
  user_id: string;
  title: string;
  programming_language: string;
  source_code: string;
  corrected_code?: string;
  description?: string;
  topic?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProgramImage {
  id: string;
  program_id: string;
  storage_path: string;
  page_number: number;
  url?: string;
}

export interface ExecutionResult {
  id?: string;
  execution_status: 'success' | 'compilation_error' | 'runtime_error' | 'time_limit' | 'memory_limit' | 'error';
  output?: string;
  error_output?: string;
  compile_output?: string;
  execution_time?: number;
  memory_used?: number;
}

export interface OCRLine {
  text: string;
  confidence: number;
  line_number: number;
  uncertain_chars?: Array<{ char: string; position: number; alternatives: string[] }>;
}

export interface OCRResult {
  code: string;
  lines: OCRLine[];
  overall_confidence: number;
}

export interface AIIssue {
  line?: number;
  problem_code: string;
  what_is_wrong: string;
  why: string;
  corrected_code: string;
  explanation: string;
}

export interface AIAnalysis {
  issues: AIIssue[];
  summary: string;
  has_errors: boolean;
  compiler_errors?: AIIssue[];
  ai_suggestions?: AIIssue[];
}

export interface AIExplainSection {
  title: string;
  content: string;
  code_snippet?: string;
}

export interface AIDryRunStep {
  step: number;
  variables: Record<string, string | number | boolean | null>;
  explanation: string;
}

export interface AIExplanation {
  title?: string;
  mode: string;
  overview?: string;
  explanation?: string;
  sections?: AIExplainSection[];
  dry_run?: AIDryRunStep[];
  key_takeaways?: string[];
}

export interface LessonContent {
  explanation: string;
  code_example: string;
  expected_output: string;
  practice_question: string;
  solution: string;
  solution_explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  class_level: number;
  board: string;
  language: string;
  content: LessonContent;
  order: number;
}

export interface LearningProgress {
  lesson_id: string;
  completed: boolean;
  completed_at?: string;
}

export type ExplanationMode =
  | 'simple_english'
  | 'hindi'
  | 'hinglish'
  | 'line_by_line'
  | 'logic'
  | 'output'
  | 'keywords'
  | 'exam';

export interface AdminStats {
  totalUsers: number;
  totalPrograms: number;
  totalExecutions: number;
  aiRequestsToday: number;
}
