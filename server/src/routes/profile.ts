import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { notFound, badRequest } from '../utils/errors.js';
import { StudentProfile } from '../types/index.js';

const router = Router();

// Apply requireAuth to all profile routes
router.use(requireAuth);

const profileSchema = z.object({
  display_name: z.string().min(1, 'Name is required').max(100),
  class_level: z.coerce
    .number()
    .int('Class level must be an integer')
    .min(6, 'Class level must be between 6 and 12')
    .max(12, 'Class level must be between 6 and 12'),
  education_board: z.string().min(1, 'Education board is required'),
  state_board: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  preferred_language: z.enum(['english', 'hindi', 'hinglish']).default('english'),
  programming_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  theme: z.string().optional().default('light'),
});

const profileUpdateSchema = profileSchema.partial();

/**
 * Normalizes input board name to match database CHECK constraint:
 * ('ICSE', 'CBSE', 'State Board', 'Other')
 */
const normalizeBoard = (raw: string): string => {
  const normalized = raw.trim().toUpperCase();
  if (normalized === 'ICSE') return 'ICSE';
  if (normalized === 'CBSE') return 'CBSE';
  if (normalized === 'STATE BOARD' || normalized === 'STATE_BOARD' || normalized === 'STATE') return 'State Board';
  if (normalized === 'OTHER' || normalized === 'OTHERS') return 'Other';
  return raw.trim();
};

/**
 * Normalizes theme to match database CHECK constraint:
 * ('light', 'dark', 'auto')
 */
const normalizeTheme = (raw?: string | null): string => {
  if (!raw) return 'light';
  const t = raw.toLowerCase().trim();
  if (t === 'dark') return 'dark';
  if (t === 'auto' || t === 'system') return 'auto';
  return 'light';
};

/**
 * GET /api/profile
 * Get current authenticated student's profile
 */
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw badRequest(error.message);
    }

    if (!data) {
      throw notFound('Profile not found. Please complete your profile setup.', 'PROFILE_NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: data as StudentProfile,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/profile
 * Create or upsert student profile
 */
router.post(
  '/',
  validate(profileSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      const profileData = {
        ...req.body,
        id: userId,
        education_board: normalizeBoard(req.body.education_board),
        theme: normalizeTheme(req.body.theme),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select();

      if (error) {
        throw badRequest(error.message, 'PROFILE_SAVE_FAILED');
      }

      const saved = (Array.isArray(data) && data.length > 0 ? data[0] : profileData) as StudentProfile;

      res.status(200).json({
        success: true,
        message: 'Profile saved successfully.',
        data: saved,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/profile
 * Update student profile (upserts if not found to avoid 0-row coercion failure)
 */
router.put(
  '/',
  validate(profileUpdateSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      const updates: Record<string, any> = {
        ...req.body,
        id: userId,
        updated_at: new Date().toISOString(),
      };

      if (req.body.education_board) {
        updates.education_board = normalizeBoard(req.body.education_board);
      }
      if (req.body.theme !== undefined) {
        updates.theme = normalizeTheme(req.body.theme);
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .upsert(updates, { onConflict: 'id' })
        .select();

      if (error) {
        throw badRequest(error.message, 'PROFILE_UPDATE_FAILED');
      }

      const saved = (Array.isArray(data) && data.length > 0 ? data[0] : updates) as StudentProfile;

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: saved,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
