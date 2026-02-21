import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { authenticate } from '../middleware/auth.js';

export const streakRouter = Router();
streakRouter.use(authenticate);

// ─── GET /streaks ────────────────────────────────────────────
streakRouter.get('/', async (req, res, next) => {
  try {
    let [streak] = await db.select()
      .from(schema.streaks)
      .where(eq(schema.streaks.userId, req.userId!))
      .limit(1);

    if (!streak) {
      // Create default streak row
      [streak] = await db.insert(schema.streaks).values({
        userId: req.userId!,
        currentStreak: 0,
        longestStreak: 0,
        freezesUsedThisWeek: 0,
        freezesAvailable: 1,
      }).returning();
    }

    res.json({ success: true, data: streak });
  } catch (err) {
    next(err);
  }
});

// ─── POST /streaks/freeze ────────────────────────────────────
// Use a streak freeze to preserve current streak on a rest day
streakRouter.post('/freeze', async (req, res, next) => {
  try {
    const [streak] = await db.select()
      .from(schema.streaks)
      .where(eq(schema.streaks.userId, req.userId!))
      .limit(1);

    if (!streak) {
      return res.status(404).json({ success: false, error: 'No streak record found' });
    }

    if (streak.freezesAvailable <= 0) {
      return res.status(400).json({ success: false, error: 'No freezes available' });
    }

    const [updated] = await db.update(schema.streaks)
      .set({
        freezesAvailable: streak.freezesAvailable - 1,
        freezesUsedThisWeek: streak.freezesUsedThisWeek + 1,
        lastActivityDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.streaks.userId, req.userId!))
      .returning();

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * Update streak after workout completion. Called from workout complete handler.
 * Returns the updated streak and any milestone reached.
 */
export async function updateStreakOnComplete(userId: string): Promise<{
  streak: typeof schema.streaks.$inferSelect;
  milestoneReached?: { days: number; tier: string };
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let [streak] = await db.select()
    .from(schema.streaks)
    .where(eq(schema.streaks.userId, userId))
    .limit(1);

  if (!streak) {
    [streak] = await db.insert(schema.streaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
      freezesUsedThisWeek: 0,
      freezesAvailable: 1,
    }).returning();
    return { streak, milestoneReached: { days: 1, tier: 'start' } };
  }

  const lastDate = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;
  let newCurrent = streak.currentStreak;

  if (lastDate) {
    lastDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);

    if (diffDays === 0) {
      // Already logged today — no change
      return { streak };
    } else if (diffDays === 1) {
      // Consecutive day ✅
      newCurrent += 1;
    } else {
      // Streak broken
      newCurrent = 1;
    }
  } else {
    newCurrent = 1;
  }

  const newLongest = Math.max(streak.longestStreak, newCurrent);

  [streak] = await db.update(schema.streaks)
    .set({
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastActivityDate: today,
      updatedAt: new Date(),
    })
    .where(eq(schema.streaks.userId, userId))
    .returning();

  // Check milestones: 7, 30, 100, 365
  const milestones = [
    { days: 365, tier: 'diamond' },
    { days: 100, tier: 'gold' },
    { days: 30, tier: 'silver' },
    { days: 7, tier: 'bronze' },
  ];
  const milestoneReached = milestones.find((m) => newCurrent === m.days);

  return { streak, milestoneReached };
}
