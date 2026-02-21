import { Router } from 'express';
import { eq, ilike, and, count, sql } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { AppError } from '../middleware/errorHandler.js';

export const cardioRouter = Router();

cardioRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 24));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const intensity = typeof req.query.intensity === 'string' ? req.query.intensity : undefined;

    const conditions = [];
    if (search) conditions.push(ilike(schema.cardioActivities.name, `%${search}%`));
    if (category) conditions.push(eq(schema.cardioActivities.category, category));
    if (intensity) conditions.push(eq(schema.cardioActivities.intensityLevel, intensity));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult, data] = await Promise.all([
      db.select({ count: count() }).from(schema.cardioActivities).where(where),
      db.select().from(schema.cardioActivities).where(where)
        .orderBy(schema.cardioActivities.name)
        .limit(pageSize)
        .offset((page - 1) * pageSize),
    ]);

    const total = totalResult[0]?.count ?? 0;

    res.json({
      success: true,
      data,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
});

cardioRouter.get('/random', async (_req, res, next) => {
  try {
    const [activity] = await db.select()
      .from(schema.cardioActivities)
      .orderBy(sql`RANDOM()`)
      .limit(1);

    res.json({ success: true, data: activity ?? null });
  } catch (err) {
    next(err);
  }
});

cardioRouter.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const [activity] = await db.select()
      .from(schema.cardioActivities)
      .where(eq(schema.cardioActivities.id, id))
      .limit(1);

    if (!activity) {
      throw new AppError(404, 'NOT_FOUND', `Cardio activity ${req.params.id} not found`);
    }

    res.json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
});
