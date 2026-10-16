import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { badRequest, notFound } from '../utils/errors.js';
import { Lesson, LessonProgress } from '../types/index.js';

const router = Router();

const param = (val: string | string[]): string => (Array.isArray(val) ? val[0] : val);

const lessonFilterSchema = z.object({
  class_level: z.coerce.number().int().min(6).max(12).optional(),
  board: z.string().optional(),
  language: z.string().optional(),
  topic: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/**
 * GET /api/lessons
 * List curriculum lessons with optional filters for class level, board, and topic.
 * Uses optionalAuth to check completion state if user is logged in.
 */
router.get(
  '/',
  optionalAuth,
  validate(lessonFilterSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { class_level, board, language, topic, page, limit } = req.query as any;

      let query = supabaseAdmin
        .from('lessons')
        .select('*', { count: 'exact' })
        .order('order_index', { ascending: true });

      if (class_level) {
        query = query.eq('class_level', Number(class_level));
      }

      if (board) {
        query = query.ilike('education_board', `%${board}%`);
      }

      if (language) {
        query = query.eq('programming_language', language.toLowerCase());
      }

      if (topic) {
        query = query.ilike('topic', `%${topic}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: lessons, count, error } = await query;

      if (error) {
        throw badRequest(error.message);
      }

      // If user is authenticated, query their completed lessons to attach completed flag
      let completedLessonIds = new Set<string>();
      if (req.user) {
        const { data: progress } = await supabaseAdmin
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', req.user.id)
          .eq('completed', true);

        if (progress) {
          completedLessonIds = new Set(progress.map((p) => p.lesson_id));
        }
      }

      const enrichedLessons = (lessons || []).map((lesson: Lesson) => ({
        ...lesson,
        is_completed: completedLessonIds.has(lesson.id),
      }));

      res.status(200).json({
        success: true,
        data: enrichedLessons,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          total_pages: count ? Math.ceil(count / limit) : 0,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/lessons/progress
 * Get learning progress stats for the authenticated student
 */
router.get(
  '/progress',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      // 1. Fetch completed lessons by user
      const { data: progressData, error: progressErr } = await supabaseAdmin
        .from('lesson_progress')
        .select('*, lessons(*)')
        .eq('user_id', userId)
        .eq('completed', true);

      if (progressErr) {
        throw badRequest(progressErr.message);
      }

      // 2. Fetch total count of lessons
      const { count: totalLessonsCount } = await supabaseAdmin
        .from('lessons')
        .select('*', { count: 'exact', head: true });

      const completedCount = progressData ? progressData.length : 0;
      const total = totalLessonsCount || 0;
      const completionPercentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

      res.status(200).json({
        success: true,
        data: {
          completed_count: completedCount,
          total_lessons: total,
          completion_percentage: completionPercentage,
          completed_lessons: progressData || [],
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/lessons/:id
 * Retrieve full details for a single lesson
 */
router.get(
  '/:id',
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lessonId = param(req.params.id);

      const { data: lesson, error } = await supabaseAdmin
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .maybeSingle();

      if (error) {
        throw badRequest(error.message);
      }

      if (!lesson) {
        throw notFound('Lesson not found.');
      }

      let isCompleted = false;
      if (req.user) {
        const { data: progress } = await supabaseAdmin
          .from('lesson_progress')
          .select('completed')
          .eq('user_id', req.user.id)
          .eq('lesson_id', lessonId)
          .maybeSingle();

        isCompleted = Boolean(progress?.completed);
      }

      res.status(200).json({
        success: true,
        data: {
          ...lesson,
          is_completed: isCompleted,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/lessons/:id/complete
 * Mark a lesson as completed for the authenticated user
 */
router.post(
  '/:id/complete',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lessonId = param(req.params.id);
      const userId = req.user!.id;

      // Ensure lesson exists
      const { data: lesson, error: lessonErr } = await supabaseAdmin
        .from('lessons')
        .select('id')
        .eq('id', lessonId)
        .maybeSingle();

      if (lessonErr || !lesson) {
        throw notFound('Lesson not found.');
      }

      const progressRecord = {
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('lesson_progress')
        .upsert(progressRecord, { onConflict: 'user_id,lesson_id' })
        .select()
        .single();

      if (error) {
        throw badRequest(error.message, 'PROGRESS_UPDATE_FAILED');
      }

      res.status(200).json({
        success: true,
        message: 'Lesson marked as completed!',
        data: data as LessonProgress,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
