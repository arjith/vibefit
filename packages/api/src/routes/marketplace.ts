import { Router } from 'express';
import { z } from 'zod';
import { eq, desc, sql, count, avg, and } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const marketplaceRouter = Router();

// ─── GET /marketplace — browse published programs ───────────
marketplaceRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const category = req.query.category as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;
    const sort = (req.query.sort as string) ?? 'popular';

    let query = db.select({
      id: schema.coachPrograms.id,
      coachId: schema.coachPrograms.coachId,
      coachName: schema.users.name,
      name: schema.coachPrograms.name,
      description: schema.coachPrograms.description,
      price: schema.coachPrograms.price,
      durationWeeks: schema.coachPrograms.durationWeeks,
      difficulty: schema.coachPrograms.difficulty,
      category: schema.coachPrograms.category,
      rating: schema.coachPrograms.rating,
      reviewCount: schema.coachPrograms.reviewCount,
      enrollmentCount: schema.coachPrograms.enrollmentCount,
      isPublished: schema.coachPrograms.isPublished,
      routineId: schema.coachPrograms.routineId,
      createdAt: schema.coachPrograms.createdAt,
      updatedAt: schema.coachPrograms.updatedAt,
    })
      .from(schema.coachPrograms)
      .innerJoin(schema.users, eq(schema.coachPrograms.coachId, schema.users.id))
      .where(eq(schema.coachPrograms.isPublished, true))
      .$dynamic();

    if (category) {
      query = query.where(eq(schema.coachPrograms.category, category));
    }
    if (difficulty) {
      query = query.where(eq(schema.coachPrograms.difficulty, difficulty));
    }

    const orderCol = sort === 'rating' ? schema.coachPrograms.rating
      : sort === 'newest' ? schema.coachPrograms.createdAt
      : sort === 'price' ? schema.coachPrograms.price
      : schema.coachPrograms.enrollmentCount;

    const rows = await query.orderBy(desc(orderCol)).limit(50);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── GET /marketplace/:id — program detail + reviews ────────
marketplaceRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const programId = req.params.id as string;

    const [program] = await db.select({
      id: schema.coachPrograms.id,
      coachId: schema.coachPrograms.coachId,
      coachName: schema.users.name,
      name: schema.coachPrograms.name,
      description: schema.coachPrograms.description,
      price: schema.coachPrograms.price,
      durationWeeks: schema.coachPrograms.durationWeeks,
      difficulty: schema.coachPrograms.difficulty,
      category: schema.coachPrograms.category,
      rating: schema.coachPrograms.rating,
      reviewCount: schema.coachPrograms.reviewCount,
      enrollmentCount: schema.coachPrograms.enrollmentCount,
      isPublished: schema.coachPrograms.isPublished,
      routineId: schema.coachPrograms.routineId,
      createdAt: schema.coachPrograms.createdAt,
      updatedAt: schema.coachPrograms.updatedAt,
    })
      .from(schema.coachPrograms)
      .innerJoin(schema.users, eq(schema.coachPrograms.coachId, schema.users.id))
      .where(eq(schema.coachPrograms.id, programId))
      .limit(1);

    if (!program) throw new AppError(404, 'NOT_FOUND', 'Program not found');

    // fetch reviews
    const reviews = await db.select({
      id: schema.programReviews.id,
      programId: schema.programReviews.programId,
      userId: schema.programReviews.userId,
      userName: schema.users.name,
      rating: schema.programReviews.rating,
      comment: schema.programReviews.comment,
      createdAt: schema.programReviews.createdAt,
    })
      .from(schema.programReviews)
      .innerJoin(schema.users, eq(schema.programReviews.userId, schema.users.id))
      .where(eq(schema.programReviews.programId, programId))
      .orderBy(desc(schema.programReviews.createdAt))
      .limit(50);

    res.json({ success: true, data: { ...program, reviews } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /marketplace/:id/enroll — enroll in a program ────
marketplaceRouter.post('/:id/enroll', authenticate, async (req, res, next) => {
  try {
    const programId = req.params.id as string;

    const [program] = await db.select()
      .from(schema.coachPrograms)
      .where(eq(schema.coachPrograms.id, programId))
      .limit(1);

    if (!program) throw new AppError(404, 'NOT_FOUND', 'Program not found');
    if (!program.isPublished) throw new AppError(400, 'NOT_PUBLISHED', 'Program is not published');

    // In production: check payment via Stripe, then increment
    await db.update(schema.coachPrograms)
      .set({ enrollmentCount: sql`${schema.coachPrograms.enrollmentCount} + 1` })
      .where(eq(schema.coachPrograms.id, programId));

    res.json({ success: true, data: { enrolled: true } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /marketplace/:id/review — leave a review ─────────
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

marketplaceRouter.post('/:id/review', authenticate, async (req, res, next) => {
  try {
    const programId = req.params.id as string;
    const body = reviewSchema.parse(req.body);

    // verify program exists
    const [program] = await db.select({ id: schema.coachPrograms.id })
      .from(schema.coachPrograms)
      .where(eq(schema.coachPrograms.id, programId))
      .limit(1);

    if (!program) throw new AppError(404, 'NOT_FOUND', 'Program not found');

    // upsert review (unique per user+program)
    await db.insert(schema.programReviews).values({
      programId,
      userId: req.userId!,
      rating: body.rating,
      comment: body.comment ?? null,
    }).onConflictDoUpdate({
      target: [schema.programReviews.programId, schema.programReviews.userId],
      set: { rating: body.rating, comment: body.comment ?? null },
    });

    // recalculate program rating
    const [stats] = await db.select({
      avgRating: avg(schema.programReviews.rating),
      total: count(),
    })
      .from(schema.programReviews)
      .where(eq(schema.programReviews.programId, programId));

    await db.update(schema.coachPrograms)
      .set({
        rating: Number(stats.avgRating) || 0,
        reviewCount: Number(stats.total),
      })
      .where(eq(schema.coachPrograms.id, programId));

    res.json({ success: true, data: { rating: body.rating } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /marketplace/my/programs — coach's own programs ────
marketplaceRouter.get('/my/programs', authenticate, async (req, res, next) => {
  try {
    const rows = await db.select()
      .from(schema.coachPrograms)
      .where(eq(schema.coachPrograms.coachId, req.userId!))
      .orderBy(desc(schema.coachPrograms.updatedAt));

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── POST /marketplace/my/programs — create a program ───────
const createProgramSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(10).max(5000),
  price: z.number().min(0).max(999),
  durationWeeks: z.number().int().min(1).max(52),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  category: z.enum(['strength', 'hypertrophy', 'weight-loss', 'endurance', 'powerlifting', 'bodybuilding', 'athletic', 'general']),
  routineId: z.string().uuid().optional(),
});

marketplaceRouter.post('/my/programs', authenticate, async (req, res, next) => {
  try {
    const body = createProgramSchema.parse(req.body);

    const [created] = await db.insert(schema.coachPrograms).values({
      coachId: req.userId!,
      name: body.name,
      description: body.description,
      price: body.price,
      durationWeeks: body.durationWeeks,
      difficulty: body.difficulty,
      category: body.category,
      routineId: body.routineId ?? null,
      isPublished: false,
    }).returning();

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /marketplace/my/programs/:id — update program ────
marketplaceRouter.patch('/my/programs/:id', authenticate, async (req, res, next) => {
  try {
    const programId = req.params.id as string;
    const body = createProgramSchema.partial().parse(req.body);

    const [existing] = await db.select()
      .from(schema.coachPrograms)
      .where(and(
        eq(schema.coachPrograms.id, programId),
        eq(schema.coachPrograms.coachId, req.userId!),
      ))
      .limit(1);

    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Program not found or not yours');

    const [updated] = await db.update(schema.coachPrograms)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.coachPrograms.id, programId))
      .returning();

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── POST /marketplace/my/programs/:id/publish — toggle ─────
marketplaceRouter.post('/my/programs/:id/publish', authenticate, async (req, res, next) => {
  try {
    const programId = req.params.id as string;

    const [existing] = await db.select()
      .from(schema.coachPrograms)
      .where(and(
        eq(schema.coachPrograms.id, programId),
        eq(schema.coachPrograms.coachId, req.userId!),
      ))
      .limit(1);

    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Program not found or not yours');

    const [updated] = await db.update(schema.coachPrograms)
      .set({ isPublished: !existing.isPublished, updatedAt: new Date() })
      .where(eq(schema.coachPrograms.id, programId))
      .returning();

    res.json({ success: true, data: { isPublished: updated.isPublished } });
  } catch (err) {
    next(err);
  }
});
