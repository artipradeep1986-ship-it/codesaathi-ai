import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '../services/ai.js';
import { supabaseAdmin } from '../db/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { config } from '../config.js';
import { StudentProfile } from '../types/index.js';

const router = Router();
router.use(requireAuth);

// Dedicated rate limiter for AI queries
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.AI_RATE_LIMIT_PER_MIN,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: `AI request rate limit reached (max ${config.AI_RATE_LIMIT_PER_MIN} queries per minute). Please wait a moment.`,
    },
  },
});

const analyzeSchema = z
  .object({
    source_code: z.string().optional(),
    code: z.string().optional(),
    language: z.string().min(1, 'Programming language is required'),
    compiler_output: z.string().optional().nullable(),
    error_message: z.string().optional().nullable(),
    program_id: z.string().optional().nullable(),
  })
  .refine(
    (d) => (d.source_code && d.source_code.trim().length > 0) || (d.code && d.code.trim().length > 0),
    {
      message: 'Source code cannot be empty',
      path: ['source_code'],
    }
  );

const explainSchema = z
  .object({
    source_code: z.string().optional(),
    code: z.string().optional(),
    language: z.string().min(1, 'Programming language is required'),
    mode: z.string().min(1, 'Explanation mode is required'),
    compiler_output: z.string().optional().nullable(),
    expected_output: z.string().optional().nullable(),
    program_id: z.string().optional().nullable(),
  })
  .refine(
    (d) => (d.source_code && d.source_code.trim().length > 0) || (d.code && d.code.trim().length > 0),
    {
      message: 'Source code cannot be empty',
      path: ['source_code'],
    }
  );

/**
 * Helper to fetch student profile or generate a fallback student profile
 */
const getStudentProfile = async (userId: string): Promise<StudentProfile> => {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (data) {
    return data as StudentProfile;
  }

  return {
    id: userId,
    display_name: 'Student',
    class_level: 10,
    education_board: 'CBSE',
    preferred_language: 'english',
    programming_level: 'beginner',
  };
};

/**
 * POST /api/ai/analyze
 * Detect errors, syntax issues, and provide educational corrections
 */
router.post(
  '/analyze',
  aiLimiter,
  validate(analyzeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const source_code = req.body.source_code || req.body.code || '';
      const language = req.body.language;
      const compiler_output = req.body.compiler_output || req.body.error_message || undefined;
      const program_id = req.body.program_id;

      const profile = await getStudentProfile(userId);

      const analysisResult = await aiService.analyzeErrors(
        source_code,
        language,
        compiler_output,
        profile
      );

      // Persist AI result
      try {
        await supabaseAdmin.from('ai_results').insert({
          id: uuidv4(),
          user_id: userId,
          program_id: program_id || null,
          request_type: 'analyze',
          language,
          input_code: source_code,
          result: analysisResult,
          created_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.error('Failed to save AI analysis record:', dbErr);
      }

      res.status(200).json({
        success: true,
        data: analysisResult,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/ai/explain
 * Explain program logic, dry run, line-by-line breakdown, or exam insights
 */
router.post(
  '/explain',
  aiLimiter,
  validate(explainSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const source_code = req.body.source_code || req.body.code || '';
      const language = req.body.language;
      const mode = req.body.mode;
      const program_id = req.body.program_id;

      const profile = await getStudentProfile(userId);

      const explanationResult = await aiService.explainCode(
        source_code,
        language,
        mode,
        profile
      );

      // Persist AI result
      try {
        await supabaseAdmin.from('ai_results').insert({
          id: uuidv4(),
          user_id: userId,
          program_id: program_id || null,
          request_type: 'explain',
          language,
          mode,
          input_code: source_code,
          result: explanationResult,
          created_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.error('Failed to save AI explanation record:', dbErr);
      }

      res.status(200).json({
        success: true,
        data: explanationResult,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
