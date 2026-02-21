import { Router } from 'express';
import { eq, ilike, and, count } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { AppError } from '../middleware/errorHandler.js';

export const exerciseRouter = Router();

exerciseRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 24));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const muscleGroup = typeof req.query.muscleGroup === 'string' ? req.query.muscleGroup : undefined;
    const equipment = typeof req.query.equipment === 'string' ? req.query.equipment : undefined;
    const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined;

    const conditions = [];
    if (search) conditions.push(ilike(schema.exercises.name, `%${search}%`));
    if (muscleGroup) conditions.push(eq(schema.exercises.muscleGroup, muscleGroup));
    if (equipment) conditions.push(eq(schema.exercises.equipment, equipment));
    if (difficulty) conditions.push(eq(schema.exercises.difficulty, difficulty));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult, data] = await Promise.all([
      db.select({ count: count() }).from(schema.exercises).where(where),
      db.select().from(schema.exercises).where(where)
        .orderBy(schema.exercises.name)
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

exerciseRouter.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const [exercise] = await db.select()
      .from(schema.exercises)
      .where(eq(schema.exercises.id, id))
      .limit(1);

    if (!exercise) {
      throw new AppError(404, 'NOT_FOUND', `Exercise ${req.params.id} not found`);
    }

    res.json({ success: true, data: exercise });
  } catch (err) {
    next(err);
  }
});
