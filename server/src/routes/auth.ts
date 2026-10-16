import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../db/supabase.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { badRequest, unauthorized } from '../utils/errors.js';

const router = Router();

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  display_name: z.string().min(2, 'Display name must be at least 2 characters').optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

const googleAuthSchema = z.object({
  id_token: z.string().optional(),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
});

/**
 * POST /api/auth/signup
 * Create a new user account
 */
router.post(
  '/signup',
  validate(signupSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, display_name } = req.body;

      // 1. Create user with email auto-confirmed via Admin API to bypass Supabase SMTP email rate limits
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: display_name || email.split('@')[0],
        },
      });

      if (createError) {
        const errMsg = createError.message || '';
        // If user already registered, try sign-in or give clear message
        if (errMsg.toLowerCase().includes('already registered') || errMsg.toLowerCase().includes('already exists')) {
          const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password,
          });

          if (!loginError && loginData.session) {
            res.status(200).json({
              success: true,
              message: 'Account already exists. Logged in successfully.',
              data: {
                user: loginData.user,
                session: loginData.session,
              },
            });
            return;
          }

          throw badRequest('This email is already registered. Please login with your password.', 'USER_EXISTS');
        }

        throw badRequest(errMsg || 'Failed to create user account.', 'SIGNUP_FAILED');
      }

      // 2. Sign in to generate access/refresh tokens for the client
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: {
          user: createData.user,
          session: sessionData?.session || null,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/login
 * Sign in existing user with email and password
 */
router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        throw unauthorized(error?.message || 'Invalid email or password.', 'INVALID_CREDENTIALS');
      }

      res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        data: {
          user: data.user,
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            expires_in: data.session.expires_in,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh expired session with refresh token
 */
router.post(
  '/refresh',
  validate(refreshSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refresh_token } = req.body;

      const { data, error } = await supabaseAdmin.auth.refreshSession({
        refresh_token,
      });

      if (error || !data.session) {
        throw unauthorized('Invalid or expired refresh token. Please log in again.', 'SESSION_EXPIRED');
      }

      res.status(200).json({
        success: true,
        data: {
          user: data.user,
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            expires_in: data.session.expires_in,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/google
 * Handle Google OAuth callback or ID token verification
 */
router.post(
  '/google',
  validate(googleAuthSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id_token, access_token } = req.body;

      if (!id_token && !access_token) {
        throw badRequest('Either id_token or access_token is required for Google sign-in.');
      }

      let authData;
      if (id_token) {
        const { data, error } = await supabaseAdmin.auth.signInWithIdToken({
          provider: 'google',
          token: id_token,
        });
        if (error) throw unauthorized(error.message);
        authData = data;
      } else {
        // If an access token from client OAuth was supplied, verify user details
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token);
        if (error || !user) throw unauthorized('Failed to authenticate with Google token.');
        authData = { user, session: { access_token } };
      }

      res.status(200).json({
        success: true,
        message: 'Google authentication successful.',
        data: authData,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/auth/session
 * Verify current session and return current user details
 */
router.get(
  '/session',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/logout
 * Invalidate session
 */
router.post(
  '/logout',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.token) {
        await supabaseAdmin.auth.admin.signOut(req.token);
      }
      res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
