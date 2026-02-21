import { eq, and, desc, gte } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';

interface DifficultyRecommendation {
  type: 'deload' | 'increase' | 'maintain' | 'reduce';
  reason: string;
  exerciseId?: string;
  exerciseName?: string;
  currentWeight?: number;
  suggestedWeight?: number;
  suggestedReps?: number;
  confidence: number; // 0-1
}

interface SessionTrend {
  avgRpe: number;
  rpeSlope: number; // positive = getting harder
  sessionCount: number;
  consistencyScore: number; // 0-1
}

/**
 * Analyze RPE trends for the user's recent sessions and generate
 * adaptive difficulty recommendations (deload, increase, maintain, reduce).
 */
export async function getAdaptiveRecommendations(
  userId: string,
): Promise<{ recommendations: DifficultyRecommendation[]; trend: SessionTrend }> {
  const recommendations: DifficultyRecommendation[] = [];

  // Fetch last 10 completed sessions with RPE
  const sessions = await db.select()
    .from(schema.workoutSessions)
    .where(and(
      eq(schema.workoutSessions.userId, userId),
      eq(schema.workoutSessions.status, 'completed'),
    ))
    .orderBy(desc(schema.workoutSessions.completedAt))
    .limit(10);

  const sessionsWithRpe = sessions.filter((s) => s.rpe !== null && s.rpe !== undefined);

  if (sessionsWithRpe.length < 3) {
    return {
      recommendations: [{
        type: 'maintain',
        reason: 'Not enough data yet — keep training and logging RPE to unlock personalized recommendations.',
        confidence: 0.3,
      }],
      trend: { avgRpe: 0, rpeSlope: 0, sessionCount: sessionsWithRpe.length, consistencyScore: 0 },
    };
  }

  // Calculate RPE trend (linear regression slope)
  const rpes = sessionsWithRpe.map((s) => s.rpe!).reverse(); // oldest→newest
  const avgRpe = rpes.reduce((a, b) => a + b, 0) / rpes.length;
  const rpeSlope = calculateSlope(rpes);

  // Consistency: how regular are the sessions? (gap analysis)
  const dates = sessionsWithRpe.map((s) => new Date(s.completedAt!).getTime()).reverse();
  const gaps = dates.slice(1).map((d, i) => (d - dates[i]) / (1000 * 60 * 60 * 24));
  const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 7;
  const consistencyScore = Math.max(0, Math.min(1, 1 - (avgGap - 2) / 5)); // 2 days = perfect, 7+ = poor

  const trend: SessionTrend = { avgRpe, rpeSlope, sessionCount: sessionsWithRpe.length, consistencyScore };

  // ─── Rule 1: Auto-deload (3+ sessions RPE ≥ 9) ─────────────
  const recentHighRpe = rpes.slice(-3).filter((r) => r >= 9);
  if (recentHighRpe.length >= 3) {
    recommendations.push({
      type: 'deload',
      reason: 'Your last 3 sessions all had RPE ≥ 9. A deload week at 60% intensity is recommended to avoid overtraining.',
      confidence: 0.9,
    });
  }

  // ─── Rule 2: RPE rising steeply (fatigue accumulation) ──────
  if (rpeSlope > 0.4 && avgRpe > 7) {
    recommendations.push({
      type: 'reduce',
      reason: `RPE is trending upward (+${rpeSlope.toFixed(1)} per session). Consider reducing volume or taking extra rest.`,
      confidence: 0.75,
    });
  }

  // ─── Rule 3: RPE consistently low → ready for progression ──
  const recentLowRpe = rpes.slice(-3).filter((r) => r <= 6);
  if (recentLowRpe.length >= 3 && avgRpe <= 6.5) {
    recommendations.push({
      type: 'increase',
      reason: 'You\'re cruising at RPE ≤ 6 for 3+ sessions. Time to increase weight or add sets for continued progress.',
      confidence: 0.8,
    });
  }

  // ─── Rule 4: Per-exercise weight suggestions ────────────────
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const recentSets = await db.select()
    .from(schema.workoutSets)
    .innerJoin(schema.workoutSessions, eq(schema.workoutSets.sessionId, schema.workoutSessions.id))
    .where(and(
      eq(schema.workoutSessions.userId, userId),
      eq(schema.workoutSessions.status, 'completed'),
      gte(schema.workoutSessions.completedAt, fourWeeksAgo),
    ))
    .orderBy(desc(schema.workoutSets.completedAt));

  // Group sets by exercise
  const exerciseSets = new Map<string, { weight: number; reps: number; rpe: number | null }[]>();
  for (const row of recentSets) {
    const eid = row.workout_sets.exerciseId;
    if (!exerciseSets.has(eid)) exerciseSets.set(eid, []);
    exerciseSets.get(eid)!.push({
      weight: row.workout_sets.weight,
      reps: row.workout_sets.reps,
      rpe: row.workout_sets.rpe,
    });
  }

  // Get exercise names for top exercises
  const exerciseIds = [...exerciseSets.keys()].slice(0, 5);
  if (exerciseIds.length > 0) {
    const exerciseRows = await db.select({ id: schema.exercises.id, name: schema.exercises.name })
      .from(schema.exercises);
    const nameMap = new Map(exerciseRows.map((e) => [e.id, e.name]));

    for (const eid of exerciseIds) {
      const sets = exerciseSets.get(eid)!;
      if (sets.length < 3) continue;

      const setsWithRpe = sets.filter((s) => s.rpe !== null);
      const maxWeight = Math.max(...sets.map((s) => s.weight));
      const name = nameMap.get(eid) ?? 'Unknown';

      if (setsWithRpe.length >= 3) {
        const exerciseAvgRpe = setsWithRpe.reduce((a, s) => a + s.rpe!, 0) / setsWithRpe.length;

        if (exerciseAvgRpe <= 6 && maxWeight > 0) {
          const increase = maxWeight <= 50 ? 2.5 : 5;
          recommendations.push({
            type: 'increase',
            reason: `Average RPE of ${exerciseAvgRpe.toFixed(1)} — you're ready to progress.`,
            exerciseId: eid,
            exerciseName: name,
            currentWeight: maxWeight,
            suggestedWeight: maxWeight + increase,
            confidence: 0.7,
          });
        } else if (exerciseAvgRpe >= 9.5) {
          recommendations.push({
            type: 'reduce',
            reason: `Average RPE of ${exerciseAvgRpe.toFixed(1)} — consider dropping weight 10% to improve form.`,
            exerciseId: eid,
            exerciseName: name,
            currentWeight: maxWeight,
            suggestedWeight: Math.round(maxWeight * 0.9 * 4) / 4,
            confidence: 0.75,
          });
        }
      }
    }
  }

  // Default: maintain
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'maintain',
      reason: 'Your training load looks balanced. Keep it up!',
      confidence: 0.6,
    });
  }

  // Sort by confidence desc
  recommendations.sort((a, b) => b.confidence - a.confidence);

  return { recommendations, trend };
}

/** Simple linear regression slope for an ordered series. */
function calculateSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }
  return den === 0 ? 0 : num / den;
}
