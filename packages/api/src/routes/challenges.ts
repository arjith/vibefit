import { Router } from 'express';
import { z } from 'zod';
import { eq, and, desc, sql, count, gte } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const challengeRouter = Router();

// ─── GET /challenges — list active + upcoming ───────────────
challengeRouter.get('/', async (_req, res, next) => {
  try {
    const now = new Date();
    const rows = await db.select({
      id: schema.challenges.id,
      name: schema.challenges.name,
      description: schema.challenges.description,
      type: schema.challenges.type,
      startDate: schema.challenges.startDate,
      endDate: schema.challenges.endDate,
      target: schema.challenges.target,
      unit: schema.challenges.unit,
      isActive: schema.challenges.isActive,
    })
      .from(schema.challenges)
      .where(gte(schema.challenges.endDate, now))
      .orderBy(desc(schema.challenges.startDate))
      .limit(50);

    // get participant counts
    const challengeIds = rows.map((r) => r.id);
    let participantCounts: Record<string, number> = {};

    if (challengeIds.length > 0) {
      const pcRows = await db.select({
        challengeId: schema.userChallenges.challengeId,
        c: count(),
      }).from(schema.userChallenges)
        .where(sql`${schema.userChallenges.challengeId} = ANY(${challengeIds})`)
        .groupBy(schema.userChallenges.challengeId);

      participantCounts = Object.fromEntries(pcRows.map((r) => [r.challengeId, Number(r.c)]));
    }

    const enriched = rows.map((r) => ({
      ...r,
      participantCount: participantCounts[r.id] ?? 0,
      currentProgress: 0,
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

// ─── GET /challenges/:id — single challenge + leaderboard ──
challengeRouter.get('/:id', async (req, res, next) => {
  try {
    const challengeId = req.params.id as string;

    const [challenge] = await db.select()
      .from(schema.challenges)
      .where(eq(schema.challenges.id, challengeId))
      .limit(1);

    if (!challenge) throw new AppError(404, 'NOT_FOUND', 'Challenge not found');

    // Leaderboard
    const leaderboard = await db.select({
      userId: schema.userChallenges.userId,
      progress: schema.userChallenges.currentProgress,
      joinedAt: schema.userChallenges.joinedAt,
      userName: schema.users.name,
      userAvatar: schema.users.avatarUrl,
    })
      .from(schema.userChallenges)
      .innerJoin(schema.users, eq(schema.userChallenges.userId, schema.users.id))
      .where(eq(schema.userChallenges.challengeId, challengeId))
      .orderBy(desc(schema.userChallenges.currentProgress))
      .limit(50);

    // Participant count
    const [{ c: participantCount }] = await db.select({ c: count() })
      .from(schema.userChallenges)
      .where(eq(schema.userChallenges.challengeId, challengeId));

    res.json({
      success: true,
      data: {
        ...challenge,
        participantCount: Number(participantCount),
        leaderboard,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /challenges/:id/join — join a challenge ───────────
challengeRouter.post('/:id/join', authenticate, async (req, res, next) => {
  try {
    const challengeId = req.params.id as string;

    const [challenge] = await db.select()
      .from(schema.challenges)
      .where(eq(schema.challenges.id, challengeId))
      .limit(1);

    if (!challenge) throw new AppError(404, 'NOT_FOUND', 'Challenge not found');
    if (!challenge.isActive) throw new AppError(400, 'INVALID', 'Challenge is not active');

    await db.insert(schema.userChallenges).values({
      userId: req.userId!,
      challengeId,
    }).onConflictDoNothing();

    res.status(201).json({ success: true, data: { joined: true } });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /challenges/:id/leave ───────────────────────────
challengeRouter.delete('/:id/leave', authenticate, async (req, res, next) => {
  try {
    const challengeId = req.params.id as string;
    await db.delete(schema.userChallenges).where(and(
      eq(schema.userChallenges.userId, req.userId!),
      eq(schema.userChallenges.challengeId, challengeId),
    ));
    res.json({ success: true, data: { joined: false } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /challenges/:id/progress — update progress ───────
const progressSchema = z.object({
  increment: z.number().int().positive(),
});

challengeRouter.post('/:id/progress', authenticate, async (req, res, next) => {
  try {
    const challengeId = req.params.id as string;
    const { increment } = progressSchema.parse(req.body);

    const [row] = await db.update(schema.userChallenges)
      .set({
        currentProgress: sql`${schema.userChallenges.currentProgress} + ${increment}`,
      })
      .where(and(
        eq(schema.userChallenges.userId, req.userId!),
        eq(schema.userChallenges.challengeId, challengeId),
      ))
      .returning();

    if (!row) throw new AppError(404, 'NOT_FOUND', 'Not enrolled in this challenge');

    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
});

// ─── GET /challenges/my — challenges I've joined ────────────
challengeRouter.get('/my/active', authenticate, async (req, res, next) => {
  try {
    const now = new Date();

    const rows = await db.select({
      id: schema.challenges.id,
      name: schema.challenges.name,
      description: schema.challenges.description,
      type: schema.challenges.type,
      startDate: schema.challenges.startDate,
      endDate: schema.challenges.endDate,
      target: schema.challenges.target,
      unit: schema.challenges.unit,
      isActive: schema.challenges.isActive,
      currentProgress: schema.userChallenges.currentProgress,
      joinedAt: schema.userChallenges.joinedAt,
    })
      .from(schema.userChallenges)
      .innerJoin(schema.challenges, eq(schema.userChallenges.challengeId, schema.challenges.id))
      .where(and(
        eq(schema.userChallenges.userId, req.userId!),
        gte(schema.challenges.endDate, now),
      ))
      .orderBy(desc(schema.challenges.startDate));

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});
