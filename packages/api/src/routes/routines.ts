import { Router } from 'express';
import { eq, and, inArray } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateRoutinePreview, persistRoutine, type GenerateRoutineRequest } from '../services/routineGenerator.js';

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

// Preview: generate routine without saving (no auth required)
routineRouter.post('/preview', async (req, res, next) => {
  try {
    const body = req.body as GenerateRoutineRequest;
    if (!body.goal || !body.daysPerWeek || !body.sessionDurationMin || !body.fitnessLevel) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Missing required fields: goal, daysPerWeek, sessionDurationMin, fitnessLevel');
    }
    const preview = await generateRoutinePreview(body);
    res.json({ success: true, data: preview });
  } catch (err) {
    next(err);
  }
});

// Duplicate an existing routine
routineRouter.post('/:id/duplicate', authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const [routine] = await db.select()
      .from(schema.routines)
      .where(and(eq(schema.routines.id, id), eq(schema.routines.userId, req.userId!)))
      .limit(1);

    if (!routine) throw new AppError(404, 'NOT_FOUND', 'Routine not found');

    // Clone the routine
    const [newRoutine] = await db.insert(schema.routines).values({
      userId: req.userId!,
      name: `${routine.name} (Copy)`,
      goal: routine.goal,
      status: 'generated',
      daysPerWeek: routine.daysPerWeek,
      sessionDurationMin: routine.sessionDurationMin,
      fitnessLevel: routine.fitnessLevel,
      availableEquipment: routine.availableEquipment,
      totalWeeks: routine.totalWeeks,
      currentWeek: 1,
    }).returning();

    // Clone weeks → days → exercises
    const weeks = await db.select().from(schema.routineWeeks)
      .where(eq(schema.routineWeeks.routineId, id));

    for (const week of weeks) {
      const [newWeek] = await db.insert(schema.routineWeeks).values({
        routineId: newRoutine.id,
        weekNumber: week.weekNumber,
        isDeload: week.isDeload,
      }).returning();

      const days = await db.select().from(schema.routineDays)
        .where(eq(schema.routineDays.weekId, week.id));

      for (const day of days) {
        const [newDay] = await db.insert(schema.routineDays).values({
          weekId: newWeek.id,
          dayNumber: day.dayNumber,
          focus: day.focus,
          isRestDay: day.isRestDay,
        }).returning();

        const exercises = await db.select().from(schema.routineExercises)
          .where(eq(schema.routineExercises.dayId, day.id));

        if (exercises.length > 0) {
          await db.insert(schema.routineExercises).values(
            exercises.map((ex) => ({
              dayId: newDay.id,
              exerciseId: ex.exerciseId,
              order: ex.order,
              sets: ex.sets,
              reps: ex.reps,
              restSeconds: ex.restSeconds,
              targetWeight: ex.targetWeight,
              alternateIds: ex.alternateIds,
            }))
          );
        }
      }
    }

    res.status(201).json({ success: true, data: newRoutine });
  } catch (err) {
    next(err);
  }
});

// Generate: preview + persist to DB (auth required)
routineRouter.post('/generate', authenticate, async (req, res, next) => {
  try {
    const body = req.body as GenerateRoutineRequest;
    if (!body.goal || !body.daysPerWeek || !body.sessionDurationMin || !body.fitnessLevel) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Missing required fields: goal, daysPerWeek, sessionDurationMin, fitnessLevel');
    }
    const preview = await generateRoutinePreview(body);
    const routine = await persistRoutine(preview, req.userId!);
    res.status(201).json({ success: true, data: routine });
  } catch (err) {
    next(err);
  }
});
