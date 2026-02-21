import { Router } from 'express';
import { eq, and, gte, desc, sql, count } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { authenticate } from '../middleware/auth.js';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);

// ─── GET /analytics/summary ─────────────────────────────────
// Aggregated stats for the logged-in user
analyticsRouter.get('/summary', async (req, res, next) => {
  try {
    const userId = req.userId!;

    // Total workouts + total duration
    const workouts = await db.select()
      .from(schema.workoutSessions)
      .where(and(
        eq(schema.workoutSessions.userId, userId),
        eq(schema.workoutSessions.status, 'completed'),
      ));

    const totalWorkouts = workouts.length;
    const totalDurationMin = Math.round(workouts.reduce((sum, w) => sum + (w.totalDurationSec ?? 0), 0) / 60);
    const avgDurationMin = totalWorkouts > 0 ? Math.round(totalDurationMin / totalWorkouts) : 0;

    // Total volume (sum of weight * reps across all sets)
    const [volumeRow] = await db.select({
      totalVolume: sql<number>`COALESCE(SUM(${schema.workoutSets.weight} * ${schema.workoutSets.reps}), 0)`,
      totalSets: count(),
    })
      .from(schema.workoutSets)
      .innerJoin(schema.workoutSessions, eq(schema.workoutSets.sessionId, schema.workoutSessions.id))
      .where(and(
        eq(schema.workoutSessions.userId, userId),
        eq(schema.workoutSessions.status, 'completed'),
      ));

    // Personal records count
    const [prRow] = await db.select({ c: count() })
      .from(schema.exerciseHistory)
      .where(and(
        eq(schema.exerciseHistory.userId, userId),
        gte(schema.exerciseHistory.timesPerformed, 1),
      ));

    // Workouts per week (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const recentWorkouts = workouts.filter((w) => new Date(w.completedAt!) >= eightWeeksAgo);

    const weeklyData: { week: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const wCount = recentWorkouts.filter((w) => {
        const d = new Date(w.completedAt!);
        return d >= start && d < end;
      }).length;
      weeklyData.push({
        week: start.toISOString().slice(5, 10),
        count: wCount,
      });
    }

    // Top exercises by times performed
    const topExercises = await db.select({
      exerciseId: schema.exerciseHistory.exerciseId,
      timesPerformed: schema.exerciseHistory.timesPerformed,
      personalBestWeight: schema.exerciseHistory.personalBestWeight,
      mastery: schema.exerciseHistory.mastery,
    })
      .from(schema.exerciseHistory)
      .where(eq(schema.exerciseHistory.userId, userId))
      .orderBy(desc(schema.exerciseHistory.timesPerformed))
      .limit(10);

    res.json({
      success: true,
      data: {
        totalWorkouts,
        totalDurationMin,
        avgDurationMin,
        totalVolume: Number(volumeRow?.totalVolume ?? 0),
        totalSets: Number(volumeRow?.totalSets ?? 0),
        totalPRs: prRow?.c ?? 0,
        weeklyData,
        topExercises,
      },
    });
  } catch (err) {
    next(err);
  }
});
