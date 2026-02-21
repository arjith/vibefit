import { eq, and, desc, gte } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';

interface AdherencePrediction {
  probability: number;
  riskLevel: 'low' | 'medium' | 'high';
  suggestion: string;
}

/**
 * Get adherence prediction for a user.
 * Uses the heuristic model (LSTM training requires accumulated data over time).
 * In production, retrain the LSTM weekly with actual user data.
 */
export async function getUserAdherencePrediction(userId: string): Promise<AdherencePrediction> {
  // Fetch current streak
  const [streak] = await db.select()
    .from(schema.streaks)
    .where(eq(schema.streaks.userId, userId))
    .limit(1);

  const currentStreak = streak?.currentStreak ?? 0;

  // Days since last workout
  const [lastSession] = await db.select({ completedAt: schema.workoutSessions.completedAt })
    .from(schema.workoutSessions)
    .where(and(
      eq(schema.workoutSessions.userId, userId),
      eq(schema.workoutSessions.status, 'completed'),
    ))
    .orderBy(desc(schema.workoutSessions.completedAt))
    .limit(1);

  const daysSinceLast = lastSession?.completedAt
    ? Math.floor((Date.now() - new Date(lastSession.completedAt).getTime()) / (1000 * 60 * 60 * 24))
    : 14;

  // Average RPE from last 5 sessions
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const recentSessions = await db.select({ rpe: schema.workoutSessions.rpe })
    .from(schema.workoutSessions)
    .where(and(
      eq(schema.workoutSessions.userId, userId),
      eq(schema.workoutSessions.status, 'completed'),
      gte(schema.workoutSessions.completedAt, twoWeeksAgo),
    ))
    .orderBy(desc(schema.workoutSessions.completedAt))
    .limit(5);

  const rpeSessions = recentSessions.filter((s) => s.rpe !== null);
  const avgRpe = rpeSessions.length > 0
    ? rpeSessions.reduce((sum, s) => sum + s.rpe!, 0) / rpeSessions.length
    : null;

  return heuristicPrediction(currentStreak, daysSinceLast, avgRpe);
}

function heuristicPrediction(
  currentStreak: number,
  daysSinceLastWorkout: number,
  recentAvgRpe: number | null,
): AdherencePrediction {
  let score = 0.5;

  if (currentStreak >= 7) score += 0.15;
  else if (currentStreak >= 3) score += 0.1;
  else if (currentStreak === 0) score -= 0.1;

  if (daysSinceLastWorkout <= 1) score += 0.1;
  else if (daysSinceLastWorkout >= 7) score -= 0.25;
  else if (daysSinceLastWorkout >= 4) score -= 0.15;

  if (recentAvgRpe !== null) {
    if (recentAvgRpe >= 9) score -= 0.1;
    else if (recentAvgRpe <= 6) score += 0.05;
  }

  const probability = Math.max(0, Math.min(1, score));
  const riskLevel: AdherencePrediction['riskLevel'] =
    probability >= 0.7 ? 'low' :
    probability >= 0.4 ? 'medium' : 'high';

  const suggestions: Record<AdherencePrediction['riskLevel'], string> = {
    low: 'You\'re on track! Keep the momentum going.',
    medium: 'Your adherence may dip — consider a lighter session or a fun workout to stay engaged.',
    high: 'Risk of skipping detected. Try a 15-minute mini session or invite a friend to keep the streak alive.',
  };

  return { probability, riskLevel, suggestion: suggestions[riskLevel] };
}
