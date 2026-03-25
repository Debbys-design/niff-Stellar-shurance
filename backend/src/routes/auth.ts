import { Router, Response, NextFunction } from 'express';
import userService from '../services/user';
import jwtService from '../services/jwt';
import config from '../config';
import { LoginRequest, LoginResponse } from '../types';

const router = Router();

/**
 * POST /auth/login
 * Staff login endpoint
 * Body: { email: string, password: string }
 */
router.post('/login', async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
        statusCode: 400,
      });
      return;
    }

    // Authenticate user
    const user = await userService.authenticate(email, password);

    if (!user) {
      // Log authentication failure without leaking credentials
      if (config.logging.logAuthFailures) {
        console.error(`[AUTH] Login failed for email: ${email}`);
      }

      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
        statusCode: 401,
      });
      return;
    }

    // Generate tokens
    const tokens = jwtService.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const response: LoginResponse = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 * Body: { refreshToken: string }
 */
router.post('/refresh', async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required',
        statusCode: 400,
      });
      return;
    }

    const result = jwtService.refreshAccessToken(refreshToken);

    if (!result) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
        statusCode: 401,
      });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /auth/me
 * Get current authenticated user info
 * Requires: Bearer token
 */
router.get('/me', async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization required',
        statusCode: 401,
      });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header',
        statusCode: 401,
      });
      return;
    }

    const payload = jwtService.verifyAccessToken(parts[1]);

    res.status(200).json({
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /auth/logout
 * Logout endpoint (client should discard tokens)
 * Note: For token invalidation, consider implementing a blacklist in production
 */
router.post('/logout', (_req, res: Response): void => {
  // In a production system, you might want to:
  // 1. Add token to a blacklist
  // 2. Clear any server-side sessions
  // For now, we just confirm logout - client must discard tokens
  res.status(200).json({
    message: 'Logged out successfully. Please discard your tokens.',
  });
});

export default router;