import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../db/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { badRequest, notFound, forbidden } from '../utils/errors.js';
import { config } from '../config.js';
import { Program, ProgramImage } from '../types/index.js';

const router = Router();
router.use(requireAuth);

/** Helper: extract a route param as a plain string (Express 5 types it as string | string[]) */
const param = (val: string | string[]): string => (Array.isArray(val) ? val[0] : val);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_IMAGE_MB * 1024 * 1024,
    files: config.MAX_PAGES,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'));
    }
  },
});

const createProgramSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  programming_language: z.string().min(1, 'Programming language is required'),
  source_code: z.string().default(''),
  corrected_code: z.string().optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  topic: z.string().max(100).optional().nullable(),
});

const updateProgramSchema = createProgramSchema.partial();

const listQuerySchema = z.object({
  search: z.string().optional(),
  topic: z.string().optional(),
  language: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

/**
 * Helper to ensure a program exists and belongs to the authenticated user
 */
const verifyProgramOwnership = async (programId: string, userId: string): Promise<Program> => {
  const { data, error } = await supabaseAdmin
    .from('programs')
    .select('*')
    .eq('id', programId)
    .maybeSingle();

  if (error) {
    throw badRequest(error.message);
  }

  if (!data) {
    throw notFound('Program not found.');
  }

  if (data.user_id !== userId) {
    throw forbidden('You do not have permission to access this program.');
  }

  return data as Program;
};

/**
 * GET /api/programs
 * List user's programs with optional pagination, search, and topic filter
 */
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { search, topic, language, page, limit } = req.query as any;

      let query = supabaseAdmin
        .from('programs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      if (topic) {
        query = query.eq('topic', topic);
      }

      if (language) {
        query = query.eq('programming_language', language);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        throw badRequest(error.message);
      }

      res.status(200).json({
        success: true,
        data: data as Program[],
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
 * GET /api/programs/:id
 * Get a single program by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const program = await verifyProgramOwnership(param(req.params.id), req.user!.id);
    res.status(200).json({
      success: true,
      data: program,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/programs
 * Create a new program
 */
router.post(
  '/',
  validate(createProgramSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const newProgram = {
        id: uuidv4(),
        user_id: userId,
        title: req.body.title,
        programming_language: req.body.programming_language.toLowerCase(),
        source_code: req.body.source_code || '',
        corrected_code: req.body.corrected_code || null,
        description: req.body.description || null,
        topic: req.body.topic || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('programs')
        .insert(newProgram)
        .select()
        .single();

      if (error) {
        throw badRequest(error.message, 'PROGRAM_CREATE_FAILED');
      }

      res.status(201).json({
        success: true,
        message: 'Program created successfully.',
        data: data as Program,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/programs/:id
 * Update an existing program
 */
router.put(
  '/:id',
  validate(updateProgramSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await verifyProgramOwnership(param(req.params.id), req.user!.id);

      const updates = {
        ...req.body,
        updated_at: new Date().toISOString(),
      };

      if (updates.programming_language) {
        updates.programming_language = updates.programming_language.toLowerCase();
      }

      const { data, error } = await supabaseAdmin
        .from('programs')
        .update(updates)
        .eq('id', param(req.params.id))
        .select()
        .single();

      if (error) {
        throw badRequest(error.message, 'PROGRAM_UPDATE_FAILED');
      }

      res.status(200).json({
        success: true,
        message: 'Program updated successfully.',
        data: data as Program,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/programs/:id
 * Delete a program and all its linked records
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const programId = param(req.params.id);
    await verifyProgramOwnership(programId, req.user!.id);

    // Delete associated execution records
    await supabaseAdmin.from('execution_records').delete().eq('program_id', programId);

    // Delete associated AI results
    await supabaseAdmin.from('ai_results').delete().eq('program_id', programId);

    // Delete associated images records
    await supabaseAdmin.from('program_images').delete().eq('program_id', programId);

    // Delete the program itself
    const { error } = await supabaseAdmin.from('programs').delete().eq('id', programId);

    if (error) {
      throw badRequest(error.message);
    }

    res.status(200).json({
      success: true,
      message: 'Program and associated records deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/programs/:id/images
 * Upload handwritten/notebook page images for a program
 */
router.post(
  '/:id/images',
  upload.array('images', config.MAX_PAGES),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const programId = param(req.params.id);
      const userId = req.user!.id;
      await verifyProgramOwnership(programId, userId);

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw badRequest('No images uploaded.');
      }

      const uploadedRecords: ProgramImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.originalname.split('.').pop() || 'jpg';
        const storagePath = `${userId}/${programId}/${uuidv4()}.${fileExt}`;

        // Attempt upload to Supabase storage if available
        try {
          await supabaseAdmin.storage
            .from('program-images')
            .upload(storagePath, file.buffer, {
              contentType: file.mimetype,
              upsert: true,
            });
        } catch (_storageErr) {
          // If storage bucket is not configured, we still record the metadata
        }

        const imageRecord: ProgramImage = {
          id: uuidv4(),
          program_id: programId,
          user_id: userId,
          storage_path: storagePath,
          page_number: i + 1,
          created_at: new Date().toISOString(),
        };

        const { data, error } = await supabaseAdmin
          .from('program_images')
          .insert(imageRecord)
          .select()
          .single();

        if (!error && data) {
          uploadedRecords.push(data as ProgramImage);
        } else {
          uploadedRecords.push(imageRecord);
        }
      }

      res.status(201).json({
        success: true,
        message: `${uploadedRecords.length} image(s) uploaded successfully.`,
        data: uploadedRecords,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/programs/:id/images
 * List all images associated with a program
 */
router.get('/:id/images', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const programId = param(req.params.id);
    await verifyProgramOwnership(programId, req.user!.id);

    const { data, error } = await supabaseAdmin
      .from('program_images')
      .select('*')
      .eq('program_id', programId)
      .order('page_number', { ascending: true });

    if (error) {
      throw badRequest(error.message);
    }

    res.status(200).json({
      success: true,
      data: data as ProgramImage[],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/programs/:id/executions
 * List all execution records for a given program
 */
router.get(
  '/:id/executions',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const programId = param(req.params.id);
      await verifyProgramOwnership(programId, req.user!.id);

      const { data, error } = await supabaseAdmin
        .from('execution_records')
        .select('*')
        .eq('program_id', programId)
        .order('created_at', { ascending: false });

      if (error) {
        throw badRequest(error.message);
      }

      res.status(200).json({
        success: true,
        data: data || [],
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
