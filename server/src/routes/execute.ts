import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { executionService } from '../services/execution.js';
import { supabaseAdmin } from '../db/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { config } from '../config.js';
import { ExecutionRequest } from '../types/index.js';

const router = Router();
router.use(requireAuth);

// Dedicated rate limiter for code execution
const executeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.RUN_RATE_LIMIT_PER_MIN,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: `Execution rate limit reached (max ${config.RUN_RATE_LIMIT_PER_MIN} runs per minute). Please wait a moment.`,
    },
  },
});

const executeSchema = z
  .object({
    source_code: z.string().optional(),
    code: z.string().optional(),
    language: z.string().min(1, 'Programming language is required'),
    input: z.string().optional().nullable(),
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
 * GET /api/execute/languages
 * List all supported execution languages and runtime details
 */
router.get(
  '/languages',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const languages = await executionService.getLanguages();
      res.status(200).json({
        success: true,
        data: languages,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/execute
 * Execute source code through Judge0 sandboxed engine and persist the record
 */
router.post(
  '/',
  executeLimiter,
  validate(executeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const requestPayload: ExecutionRequest = {
        source_code: req.body.source_code || req.body.code || '',
        language: req.body.language,
        input: req.body.input || undefined,
        program_id: req.body.program_id || undefined,
      };

      // Execute code via Judge0 service
      const executionResult = await executionService.execute(requestPayload, userId);

      // Persist execution result to Supabase
      try {
        await supabaseAdmin.from('execution_records').insert(executionResult);
      } catch (dbErr) {
        console.error('Failed to log execution record to database:', dbErr);
      }

      res.status(200).json({
        success: true,
        data: executionResult,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
