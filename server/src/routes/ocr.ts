import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { ocrService, PageImageInput } from '../services/ocr.js';
import { requireAuth } from '../middleware/auth.js';
import { badRequest } from '../utils/errors.js';
import { config } from '../config.js';

const router = Router();
router.use(requireAuth);

const ocrLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'OCR request rate limit reached. Please wait a moment before submitting more images.',
    },
  },
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_IMAGE_MB * 1024 * 1024,
    files: config.MAX_PAGES,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only JPEG, PNG, and WebP formats are supported.'));
    }
  },
});

/**
 * POST /api/ocr/process
 * Accepts one or more handwritten code page images, transcribes them with line confidence,
 * and detects ambiguous characters.
 */
router.post(
  '/process',
  ocrLimiter,
  upload.array('images', config.MAX_PAGES),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw badRequest('Please upload at least one image file (field name: "images").');
      }

      const imageInputs: PageImageInput[] = files.map((file, idx) => ({
        base64: file.buffer.toString('base64'),
        mimeType: file.mimetype,
        pageNumber: idx + 1,
      }));

      const result = await ocrService.processImages(imageInputs);

      res.status(200).json({
        success: true,
        message: `Successfully processed ${files.length} page(s).`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
