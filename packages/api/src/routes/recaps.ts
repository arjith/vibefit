import { Router } from 'express';
import { eq, and, gte, lte, sql, count } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { authenticate } from '../middleware/auth.js';

export const recapRouter = Router();
recapRouter.use(authenticate);

// ─── GET /recaps/weekly ──────────────────────────────────────
recapRouter.get('/weekly', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    const recap = await buildRecap(userId, weekStart, now);
    res.json({ success: true, data: { period: 'weekly', startDate: weekStart.toISOString(), ...recap } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /recaps/monthly ─────────────────────────────────────
recapRouter.get('/monthly', async (req, res, next) => {
  try {
    const userId = req.userId!;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const recap = await buildRecap(userId, monthStart, now);
    res.json({ success: true, data: { period: 'monthly', startDate: monthStart.toISOString(), ...recap } });
  } catch (err) {
    next(err);
  }
});

async function buildRecap(userId: string, start: Date, end: Date) {
  // Completed workouts in range
  const workouts = await db.select()
    .from(schema.workoutSessions)
    .where(and(
      eq(schema.workoutSessions.userId, userId),
      eq(schema.workoutSessions.status, 'completed'),
      gte(schema.workoutSessions.completedAt, start),
      lte(schema.workoutSessions.completedAt, end),
    ));

  const totalWorkouts = workouts.length;
  const totalDurationMin = Math.round(workouts.reduce((s, w) => s + (w.totalDurationSec ?? 0), 0) / 60);
  const avgRpe = totalWorkouts > 0
    ? parseFloat((workouts.reduce((s, w) => s + (w.rpe ?? 0), 0) / workouts.filter((w) => w.rpe).length).toFixed(1))
    : 0;
  const avgMood = totalWorkouts > 0
    ? parseFloat((workouts.reduce((s, w) => s + (w.mood ?? 0), 0) / workouts.filter((w) => w.mood).length).toFixed(1))
    : 0;

  // Volume in range
  const sessionIds = workouts.map((w) => w.id);
  let totalVolume = 0;
  let totalSets = 0;

  if (sessionIds.length > 0) {
    const [vol] = await db.select({
      v: sql<number>`COALESCE(SUM(${schema.workoutSets.weight} * ${schema.workoutSets.reps}), 0)`,
      c: count(),
    })
      .from(schema.workoutSets)
      .where(sql`${schema.workoutSets.sessionId} = ANY(ARRAY[${sql.join(sessionIds.map((id) => sql`${id}::uuid`), sql`, `)}])`);

    totalVolume = Number(vol?.v ?? 0);
    totalSets = Number(vol?.c ?? 0);
  }

  // Streaks
  const [streak] = await db.select()
    .from(schema.streaks)
    .where(eq(schema.streaks.userId, userId))
    .limit(1);

  // New achievements in range
  const newAchievements = await db.select({
    name: schema.achievements.name,
    rarity: schema.achievements.rarity,
  })
    .from(schema.userAchievements)
    .innerJoin(schema.achievements, eq(schema.userAchievements.achievementId, schema.achievements.id))
    .where(and(
      eq(schema.userAchievements.userId, userId),
      gte(schema.userAchievements.unlockedAt, start),
      lte(schema.userAchievements.unlockedAt, end),
    ));

  return {
    totalWorkouts,
    totalDurationMin,
    totalVolume,
    totalSets,
    avgRpe,
    avgMood,
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    newAchievements,
  };
}
