import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../db/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { badRequest, notFound } from '../utils/errors.js';
import { Lesson, CurriculumDoc } from '../types/index.js';

const router = Router();
const param = (val: string | string[]): string => (Array.isArray(val) ? val[0] : val);

// Apply auth and admin check to all admin routes
router.use(requireAuth);
router.use(requireAdmin);

const lessonSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Lesson title is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  class_level: z.coerce.number().int().min(6).max(12),
  education_board: z.string().min(1, 'Education board is required'),
  programming_language: z.string().min(1, 'Programming language is required'),
  topic: z.string().min(1, 'Topic is required'),
  order_index: z.coerce.number().int().min(0).default(0),
  content: z.string().min(1, 'Lesson content is required'),
  starter_code: z.string().optional().nullable(),
  solution_code: z.string().optional().nullable(),
});

const curriculumSchema = z.object({
  title: z.string().min(1, 'Title is required').max(250),
  board: z.string().min(1, 'Education board is required'),
  class_level: z.coerce.number().int().min(6).max(12),
  subject: z.string().min(1, 'Subject is required'),
  document_url: z.string().url().optional().nullable(),
  content: z.string().optional().nullable(),
});

/**
 * GET /api/admin/stats
 * Aggregate platform statistics for administrative dashboard
 */
router.get(
  '/stats',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [usersRes, programsRes, executionsRes, aiRes, lessonsRes] = await Promise.all([
        supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('programs').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('execution_records').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('ai_results').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('lessons').select('*', { count: 'exact', head: true }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          total_users: usersRes.count ?? 0,
          total_programs: programsRes.count ?? 0,
          total_executions: executionsRes.count ?? 0,
          total_ai_queries: aiRes.count ?? 0,
          total_lessons: lessonsRes.count ?? 0,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/admin/lessons
 * Create or update a lesson
 */
router.post(
  '/lessons',
  validate(lessonSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lessonPayload = {
        id: req.body.id || uuidv4(),
        ...req.body,
        programming_language: req.body.programming_language.toLowerCase(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('lessons')
        .upsert(lessonPayload)
        .select()
        .single();

      if (error) {
        throw badRequest(error.message, 'LESSON_UPSERT_FAILED');
      }

      res.status(200).json({
        success: true,
        message: 'Lesson saved successfully.',
        data: data as Lesson,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/admin/lessons/:id
 * Delete a lesson by ID
 */
router.delete(
  '/lessons/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lessonId = param(req.params.id);

      // Delete associated progress records
      await supabaseAdmin.from('lesson_progress').delete().eq('lesson_id', lessonId);

      const { error } = await supabaseAdmin.from('lessons').delete().eq('id', lessonId);

      if (error) {
        throw badRequest(error.message);
      }

      res.status(200).json({
        success: true,
        message: 'Lesson deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/admin/curriculum
 * Register or upload curriculum document reference
 */
router.post(
  '/curriculum',
  validate(curriculumSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const docPayload = {
        id: uuidv4(),
        ...req.body,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('curriculum_docs')
        .insert(docPayload)
        .select()
        .single();

      if (error) {
        throw badRequest(error.message, 'CURRICULUM_UPLOAD_FAILED');
      }

      res.status(201).json({
        success: true,
        message: 'Curriculum document registered successfully.',
        data: data as CurriculumDoc,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/admin/curriculum
 * List curriculum documents with optional board and class filters
 */
router.get(
  '/curriculum',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { board, class_level } = req.query;

      let query = supabaseAdmin
        .from('curriculum_docs')
        .select('*')
        .order('class_level', { ascending: true });

      if (board) {
        query = query.eq('board', String(board));
      }

      if (class_level) {
        query = query.eq('class_level', Number(class_level));
      }

      const { data, error } = await query;

      if (error) {
        throw badRequest(error.message);
      }

      res.status(200).json({
        success: true,
        data: (data || []) as CurriculumDoc[],
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
