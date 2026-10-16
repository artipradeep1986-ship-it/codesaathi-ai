import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { badRequest } from '../utils/errors.js';

export type ValidationTarget = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req[target]);
      if (!result.success) {
        const errors = (result.error as ZodError).errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(badRequest('Validation failed', 'VALIDATION_ERROR', errors));
      }

      // Assign parsed/sanitized value back to the request object
      req[target] = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
};
