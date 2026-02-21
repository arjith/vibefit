import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
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
  return { accessToken, refreshToken, expiresIn: 900 };
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await db.select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, body.email))
      .limit(1);

    if (existing.length > 0) {
      throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db.insert(schema.users).values({
      email: body.email,
      name: body.name,
      passwordHash,
    }).returning();

    // Create empty profile
    await db.insert(schema.userProfiles).values({ userId: user.id });
    // Create streak record
    await db.insert(schema.streaks).values({ userId: user.id });

    const tokens = generateTokens(user.id);

    // Store refresh token
    await db.update(schema.users)
      .set({ refreshToken: tokens.refreshToken })
      .where(eq(schema.users.id, user.id));

    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, createdAt: user.createdAt, updatedAt: user.updatedAt },
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

    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, body.email))
      .limit(1);

    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const tokens = generateTokens(user.id);

    // Store refresh token
    await db.update(schema.users)
      .set({ refreshToken: tokens.refreshToken, updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));

    res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, createdAt: user.createdAt, updatedAt: user.updatedAt },
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

    // Validate stored refresh token matches
    const [user] = await db.select({ id: schema.users.id, refreshToken: schema.users.refreshToken })
      .from(schema.users)
      .where(eq(schema.users.id, payload.userId))
      .limit(1);

    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError(401, 'INVALID_TOKEN', 'Refresh token is invalid or revoked');
    }

    const tokens = generateTokens(payload.userId);

    // Rotate refresh token
    await db.update(schema.users)
      .set({ refreshToken: tokens.refreshToken })
      .where(eq(schema.users.id, payload.userId));

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

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const [user] = await db.select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      avatarUrl: schema.users.avatarUrl,
      createdAt: schema.users.createdAt,
      updatedAt: schema.users.updatedAt,
    })
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});
