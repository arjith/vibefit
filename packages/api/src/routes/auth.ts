import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { JWT_SECRET, authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const authRouter = Router();

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'vibefit-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken, expiresIn: 900 }; // 15 min in seconds
}

// TODO: Replace with database queries once @vibefit/core is wired
// Temporary in-memory store for bootstrapping
const usersStore: Map<string, { id: string; email: string; name: string; passwordHash: string }> = new Map();

// Seed demo user
(async () => {
  const hash = await bcrypt.hash('password123', 12);
  usersStore.set('demo@vibefit.app', {
    id: 'demo-user-1',
    email: 'demo@vibefit.app',
    name: 'Demo User',
    passwordHash: hash,
  });
})();

authRouter.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    if (usersStore.has(body.email)) {
      throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const id = uuidv4();
    const user = { id, email: body.email, name: body.name, passwordHash };
    usersStore.set(body.email, user);

    const tokens = generateTokens(id);

    res.status(201).json({
      success: true,
      data: {
        user: { id, email: body.email, name: body.name, avatarUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = usersStore.get(body.email);

    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const tokens = generateTokens(user.id);

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, avatarUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        tokens,
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError(400, 'MISSING_TOKEN', 'Refresh token is required');
    }

    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { userId: string };
    const tokens = generateTokens(payload.userId);

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'INVALID_TOKEN', 'Refresh token is invalid or expired'));
    } else {
      next(err);
    }
  }
});

authRouter.get('/me', authenticate, (req, res) => {
  // Find user by ID
  for (const user of usersStore.values()) {
    if (user.id === req.userId) {
      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return;
    }
  }
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
});
