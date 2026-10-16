export interface StudentProfile {
  id: string;
  display_name: string;
  class_level: number;
  education_board: string;
  state_board?: string;
  subject?: string;
  preferred_language: 'english' | 'hindi' | 'hinglish';
  programming_level: 'beginner' | 'intermediate' | 'advanced';
  theme?: string;
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
  user_id: string;
  storage_path: string;
  page_number: number;
  created_at?: string;
}

export interface ExecutionRecord {
  id: string;
  program_id?: string;
  user_id: string;
  language: string;
  source_code: string;
  input?: string;
  execution_status: string;
  output?: string;
  error_output?: string;
  compile_output?: string;
  execution_time?: number;
  memory_used?: number;
  created_at?: string;
}

export interface ExecutionRequest {
  source_code: string;
  language: string;
  input?: string;
  program_id?: string;
}

export interface AIRequest {
  source_code: string;
  language: string;
  mode: string;
  compiler_output?: string;
  expected_output?: string;
}

export interface OCRLine {
  text: string;
  confidence: number;
  line_number: number;
  uncertain_chars?: Array<{
    char: string;
    position: number;
    alternatives: string[];
  }>;
}

export interface OCRResult {
  code: string;
  lines: OCRLine[];
  overall_confidence: number;
}

export interface AIIssue {
  line: number;
  problem_code: string;
  what_is_wrong: string;
  why: string;
  corrected_code: string;
  explanation: string;
}

export interface AIAnalysisResponse {
  summary: string;
  has_errors: boolean;
  issues: AIIssue[];
  corrected_full_code: string;
  encouragement: string;
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

export interface AIExplainResponse {
  title: string;
  mode: string;
  overview: string;
  explanation?: string;
  sections: AIExplainSection[];
  dry_run?: AIDryRunStep[];
  key_takeaways: string[];
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  class_level: number;
  education_board: string;
  programming_language: string;
  topic: string;
  order_index: number;
  content: string;
  starter_code?: string;
  solution_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
}

export interface CurriculumDoc {
  id: string;
  title: string;
  board: string;
  class_level: number;
  subject: string;
  document_url?: string;
  content?: string;
  created_at?: string;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}
