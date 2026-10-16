import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../db/supabase.js';
import { unauthorized, forbidden } from '../utils/errors.js';
import { AuthenticatedUser } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: string;
    }
  }
}

const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7).trim();
};

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw unauthorized('Authentication required. Missing or invalid Bearer token.');
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      throw unauthorized('Invalid or expired authentication token. Please log in again.');
    }

    req.user = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
    };
    req.token = token;

    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return next();
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      };
      req.token = token;
    }

    next();
  } catch (_err) {
    // Optional auth silently continues even if token validation fails
    next();
  }
};

export const requireAdmin = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      // If requireAuth was not run before requireAdmin, authenticate first
      const token = extractBearerToken(req);
      if (!token) {
        throw unauthorized('Authentication required.');
      }
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        throw unauthorized('Invalid authentication token.');
      }
      req.user = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      };
      req.token = token;
    }

    // Check user metadata for admin role
    if (req.user.app_metadata?.role === 'admin' || req.user.user_metadata?.role === 'admin') {
      return next();
    }

    // Check user_roles table in database
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', req.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (error || !data) {
      throw forbidden('Access denied. Administrator privileges required.');
    }

    next();
  } catch (err) {
    next(err);
  }
};
