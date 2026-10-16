import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, code: string = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const badRequest = (message: string = 'Bad request', code: string = 'BAD_REQUEST', details?: unknown) =>
  new AppError(400, message, code, details);

export const unauthorized = (message: string = 'Unauthorized', code: string = 'UNAUTHORIZED', details?: unknown) =>
  new AppError(401, message, code, details);

export const forbidden = (message: string = 'Forbidden', code: string = 'FORBIDDEN', details?: unknown) =>
  new AppError(403, message, code, details);

export const notFound = (message: string = 'Resource not found', code: string = 'NOT_FOUND', details?: unknown) =>
  new AppError(404, message, code, details);

export const rateLimited = (message: string = 'Too many requests, please slow down', code: string = 'RATE_LIMITED', details?: unknown) =>
  new AppError(429, message, code, details);

export const serviceUnavailable = (message: string = 'Service temporarily unavailable', code: string = 'SERVICE_UNAVAILABLE', details?: unknown) =>
  new AppError(503, message, code, details);

export const errorHandler = (
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: formattedErrors,
      },
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message: err.message,
      },
    });
    return;
  }

  // Default server error
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : err.message || 'Internal server error',
    },
  });
};
