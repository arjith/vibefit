import { Router } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { authenticate } from '../middleware/auth.js';

export const achievementRouter = Router();
achievementRouter.use(authenticate);

// ─── GET /achievements ───────────────────────────────────────
// Returns all achievements with user unlock status
achievementRouter.get('/', async (req, res, next) => {
  try {
    const all = await db.select().from(schema.achievements);

    const userProgress = await db.select()
      .from(schema.userAchievements)
      .where(eq(schema.userAchievements.userId, req.userId!));

    const progressMap = new Map(userProgress.map((ua) => [ua.achievementId, ua]));

    const result = all.map((a) => {
      const ua = progressMap.get(a.id);
      return {
        ...a,
        progress: ua?.progress ?? 0,
        unlocked: !!ua?.unlockedAt,
        unlockedAt: ua?.unlockedAt ?? null,
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ─── GET /achievements/unlocked ──────────────────────────────
achievementRouter.get('/unlocked', async (req, res, next) => {
  try {
    const unlocked = await db.select({
      id: schema.achievements.id,
      name: schema.achievements.name,
      description: schema.achievements.description,
      category: schema.achievements.category,
      rarity: schema.achievements.rarity,
      iconUrl: schema.achievements.iconUrl,
      unlockedAt: schema.userAchievements.unlockedAt,
    })
      .from(schema.userAchievements)
      .innerJoin(schema.achievements, eq(schema.userAchievements.achievementId, schema.achievements.id))
      .where(and(
        eq(schema.userAchievements.userId, req.userId!),
        sql`${schema.userAchievements.unlockedAt} IS NOT NULL`,
      ));

    res.json({ success: true, data: unlocked });
  } catch (err) {
    next(err);
  }
});
