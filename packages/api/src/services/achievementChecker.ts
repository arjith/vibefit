import { eq, and, sql, count, gte } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';

export interface UnlockedAchievement {
  achievementId: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
}

/**
 * Check all achievements for a user and unlock any newly earned ones.
 * Called after workout completion.
 */
export async function checkAchievements(userId: string): Promise<UnlockedAchievement[]> {
  const allAchievements = await db.select().from(schema.achievements);
  const existingUnlocks = await db.select({ achievementId: schema.userAchievements.achievementId })
    .from(schema.userAchievements)
    .where(and(
      eq(schema.userAchievements.userId, userId),
      sql`${schema.userAchievements.unlockedAt} IS NOT NULL`,
    ));

  const unlockedIds = new Set(existingUnlocks.map((u) => u.achievementId));
  const locked = allAchievements.filter((a) => !unlockedIds.has(a.id));

  if (locked.length === 0) return [];

  // Gather stats once
  const stats = await gatherStats(userId);
  const newlyUnlocked: UnlockedAchievement[] = [];

  for (const achievement of locked) {
    const earned = evaluateRequirement(achievement.requirement, stats);
    if (earned) {
      // Upsert user_achievement with unlock
      await db.insert(schema.userAchievements).values({
        userId,
        achievementId: achievement.id,
        progress: 100,
        unlockedAt: new Date(),
      }).onConflictDoNothing();

      newlyUnlocked.push({
        achievementId: achievement.id,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        rarity: achievement.rarity,
      });
    }
  }

  return newlyUnlocked;
}

interface UserStats {
  totalWorkouts: number;
  currentStreak: number;
  totalPRs: number;
  uniqueExercises: number;
}

async function gatherStats(userId: string): Promise<UserStats> {
  // Total completed workouts
  const [wc] = await db.select({ c: count() })
    .from(schema.workoutSessions)
    .where(and(
      eq(schema.workoutSessions.userId, userId),
      eq(schema.workoutSessions.status, 'completed'),
    ));

  // Current streak
  const [streak] = await db.select({ currentStreak: schema.streaks.currentStreak })
    .from(schema.streaks)
    .where(eq(schema.streaks.userId, userId))
    .limit(1);

  // Total PRs — count rows in exercise_history that have a personal best > 0
  const [prCount] = await db.select({ c: count() })
    .from(schema.exerciseHistory)
    .where(and(
      eq(schema.exerciseHistory.userId, userId),
      gte(schema.exerciseHistory.timesPerformed, 1),
    ));

  // Unique exercises
  const [ue] = await db.select({ c: count() })
    .from(schema.exerciseHistory)
    .where(eq(schema.exerciseHistory.userId, userId));

  return {
    totalWorkouts: wc?.c ?? 0,
    currentStreak: streak?.currentStreak ?? 0,
    totalPRs: prCount?.c ?? 0,
    uniqueExercises: ue?.c ?? 0,
  };
}

function evaluateRequirement(requirement: string, stats: UserStats): boolean {
  // Parse simple requirement strings like "workouts >= 1", "streak >= 7", "prs >= 25", "unique_exercises >= 20"
  const match = requirement.match(/^(\w+)\s*>=\s*(\d+)$/);
  if (!match) return false;

  const [, metric, thresholdStr] = match;
  const threshold = parseInt(thresholdStr, 10);

  switch (metric) {
    case 'workouts': return stats.totalWorkouts >= threshold;
    case 'streak': return stats.currentStreak >= threshold;
    case 'prs': return stats.totalPRs >= threshold;
    case 'unique_exercises': return stats.uniqueExercises >= threshold;
    default: return false; // Complex requirements (bench_1rm, bodyweight, time-based) evaluated later
  }
}
