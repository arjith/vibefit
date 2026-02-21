import { Router } from 'express';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { detectPersonalRecords } from '../services/prDetector.js';
import { updateStreakOnComplete } from './streaks.js';
import { checkAchievements } from '../services/achievementChecker.js';

export const workoutRouter = Router();
workoutRouter.use(authenticate);

// ─── POST /workouts/start ────────────────────────────────────
// Start a workout session from a routine day
const startSchema = z.object({
  routineId: z.string().uuid(),
  weekNumber: z.number().int().min(1),
  dayNumber: z.number().int().min(1),
});

workoutRouter.post('/start', async (req, res, next) => {
  try {
    const body = startSchema.parse(req.body);

    // Verify the routine belongs to this user
    const [routine] = await db.select({ id: schema.routines.id })
      .from(schema.routines)
      .where(and(
        eq(schema.routines.id, body.routineId),
        eq(schema.routines.userId, req.userId!),
      ))
      .limit(1);

    if (!routine) {
      throw new AppError(404, 'NOT_FOUND', 'Routine not found');
    }

    const [session] = await db.insert(schema.workoutSessions).values({
      userId: req.userId!,
      routineId: body.routineId,
      weekNumber: body.weekNumber,
      dayNumber: body.dayNumber,
      status: 'in-progress',
      startedAt: new Date(),
    }).returning();

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

// ─── GET /workouts ───────────────────────────────────────────
workoutRouter.get('/', async (req, res, next) => {
  try {
    const sessions = await db.select()
      .from(schema.workoutSessions)
      .where(eq(schema.workoutSessions.userId, req.userId!))
      .orderBy(desc(schema.workoutSessions.createdAt))
      .limit(50);

    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
});

// ─── GET /workouts/:id ───────────────────────────────────────
workoutRouter.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const [session] = await db.select()
      .from(schema.workoutSessions)
      .where(and(
        eq(schema.workoutSessions.id, id),
        eq(schema.workoutSessions.userId, req.userId!),
      ))
      .limit(1);

    if (!session) {
      throw new AppError(404, 'NOT_FOUND', 'Workout session not found');
    }

    // Fetch sets for this session
    const sets = await db.select()
      .from(schema.workoutSets)
      .where(eq(schema.workoutSets.sessionId, id));

    res.json({
      success: true,
      data: { ...session, sets },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /workouts/:id/sets ─────────────────────────────────
// Log a single set
const logSetSchema = z.object({
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().min(1),
  weight: z.number().min(0),
  reps: z.number().int().min(0),
  rpe: z.number().int().min(1).max(10).optional(),
  isWarmup: z.boolean().optional(),
  isDropSet: z.boolean().optional(),
});

workoutRouter.post('/:id/sets', async (req, res, next) => {
  try {
    const sessionId = req.params.id as string;
    const body = logSetSchema.parse(req.body);

    // Verify session belongs to user and is in-progress
    const [session] = await db.select({ id: schema.workoutSessions.id, status: schema.workoutSessions.status })
      .from(schema.workoutSessions)
      .where(and(
        eq(schema.workoutSessions.id, sessionId),
        eq(schema.workoutSessions.userId, req.userId!),
      ))
      .limit(1);

    if (!session) {
      throw new AppError(404, 'NOT_FOUND', 'Workout session not found');
    }
    if (session.status !== 'in-progress' && session.status !== 'paused') {
      throw new AppError(400, 'INVALID_STATUS', 'Cannot log sets for a session that is not in-progress');
    }

    const [set] = await db.insert(schema.workoutSets).values({
      sessionId,
      exerciseId: body.exerciseId,
      setNumber: body.setNumber,
      weight: body.weight,
      reps: body.reps,
      rpe: body.rpe ?? null,
      isWarmup: body.isWarmup ?? false,
      isDropSet: body.isDropSet ?? false,
    }).returning();

    // Detect personal records (skip warmup sets)
    const prs = body.isWarmup
      ? []
      : await detectPersonalRecords(req.userId!, body.exerciseId, body.weight, body.reps);

    res.status(201).json({ success: true, data: { set, personalRecords: prs } });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /workouts/:id/pause ─────────────────────────────────
workoutRouter.put('/:id/pause', async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const [updated] = await db.update(schema.workoutSessions)
      .set({ status: 'paused', pausedAt: new Date() })
      .where(and(
        eq(schema.workoutSessions.id, id),
        eq(schema.workoutSessions.userId, req.userId!),
        eq(schema.workoutSessions.status, 'in-progress'),
      ))
      .returning();

    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Session not found or not in-progress');
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /workouts/:id/resume ────────────────────────────────
workoutRouter.put('/:id/resume', async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const [updated] = await db.update(schema.workoutSessions)
      .set({ status: 'in-progress', pausedAt: null })
      .where(and(
        eq(schema.workoutSessions.id, id),
        eq(schema.workoutSessions.userId, req.userId!),
        eq(schema.workoutSessions.status, 'paused'),
      ))
      .returning();

    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Session not found or not paused');
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /workouts/:id/complete ──────────────────────────────
const completeSchema = z.object({
  rpe: z.number().int().min(1).max(10).optional(),
  mood: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
  totalDurationSec: z.number().int().min(0),
});

workoutRouter.put('/:id/complete', async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const body = completeSchema.parse(req.body);

    const [updated] = await db.update(schema.workoutSessions)
      .set({
        status: 'completed',
        completedAt: new Date(),
        rpe: body.rpe ?? null,
        mood: body.mood ?? null,
        notes: body.notes ?? null,
        totalDurationSec: body.totalDurationSec,
      })
      .where(and(
        eq(schema.workoutSessions.id, id),
        eq(schema.workoutSessions.userId, req.userId!),
      ))
      .returning();

    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Session not found');
    }

    // Update streak
    const streakResult = await updateStreakOnComplete(req.userId!);

    // Check achievements
    const newAchievements = await checkAchievements(req.userId!);

    res.json({
      success: true,
      data: {
        session: updated,
        streak: streakResult.streak,
        milestoneReached: streakResult.milestoneReached ?? null,
        achievements: newAchievements,
      },
    });
  } catch (err) {
    next(err);
  }
});
