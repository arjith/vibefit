import { Router } from 'express';
import { eq, and, inArray } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const routineRouter = Router();

routineRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const data = await db.select()
      .from(schema.routines)
      .where(eq(schema.routines.userId, req.userId!))
      .orderBy(schema.routines.createdAt);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

routineRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const [routine] = await db.select()
      .from(schema.routines)
      .where(and(
        eq(schema.routines.id, id),
        eq(schema.routines.userId, req.userId!),
      ))
      .limit(1);

    if (!routine) {
      throw new AppError(404, 'NOT_FOUND', `Routine ${id} not found`);
    }

    // Fetch weeks, days, and exercises
    const weeks = await db.select()
      .from(schema.routineWeeks)
      .where(eq(schema.routineWeeks.routineId, routine.id))
      .orderBy(schema.routineWeeks.weekNumber);

    const weekIds = weeks.map(w => w.id);
    const days = weekIds.length > 0
      ? await db.select().from(schema.routineDays)
          .where(inArray(schema.routineDays.weekId, weekIds))
          .orderBy(schema.routineDays.dayNumber)
      : [];

    const dayIds = days.map(d => d.id);
    const exercises = dayIds.length > 0
      ? await db.select().from(schema.routineExercises)
          .where(inArray(schema.routineExercises.dayId, dayIds))
          .orderBy(schema.routineExercises.order)
      : [];

    res.json({
      success: true,
      data: {
        ...routine,
        weeks: weeks.map(week => ({
          ...week,
          days: days
            .filter(d => d.weekId === week.id)
            .map(day => ({
              ...day,
              exercises: exercises.filter(e => e.dayId === day.id),
            })),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

routineRouter.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const [routine] = await db.select({ id: schema.routines.id })
      .from(schema.routines)
      .where(and(
        eq(schema.routines.id, id),
        eq(schema.routines.userId, req.userId!),
      ))
      .limit(1);

    if (!routine) {
      throw new AppError(404, 'NOT_FOUND', `Routine ${req.params.id} not found`);
    }

    await db.delete(schema.routines).where(eq(schema.routines.id, routine.id));

    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

// Preview and Generate will be implemented with the routine generator engine
routineRouter.post('/preview', (_req, res) => {
  res.json({ success: true, data: null, message: 'Routine generator coming in Phase 1.3' });
});

routineRouter.post('/generate', authenticate, (_req, res) => {
  res.json({ success: true, data: null, message: 'Routine generator coming in Phase 1.3' });
});
