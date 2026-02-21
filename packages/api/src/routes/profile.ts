import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const profileRouter = Router();
profileRouter.use(authenticate);

// ─── GET /profile ────────────────────────────────────────────
profileRouter.get('/', async (req, res, next) => {
  try {
    const [profile] = await db.select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, req.userId!))
      .limit(1);

    if (!profile) {
      throw new AppError(404, 'NOT_FOUND', 'Profile not found');
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /profile ────────────────────────────────────────────
const updateProfileSchema = z.object({
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  biologicalSex: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),
  heightCm: z.number().min(50).max(300).optional().nullable(),
  weightKg: z.number().min(20).max(500).optional().nullable(),
  age: z.number().int().min(13).max(120).optional().nullable(),
  bodyFatPercent: z.number().min(1).max(80).optional().nullable(),
  preferredEquipment: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  injuryZones: z.array(z.object({
    bodyPart: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe']),
    notes: z.string().nullable().optional(),
  })).optional(),
  trainingDaysPerWeek: z.number().int().min(1).max(7).optional(),
  sessionDurationMin: z.number().int().min(15).max(180).optional(),
});

profileRouter.put('/', async (req, res, next) => {
  try {
    const body = updateProfileSchema.parse(req.body);

    const [updated] = await db.update(schema.userProfiles)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.userProfiles.userId, req.userId!))
      .returning();

    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Profile not found');
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /profile/onboarding ────────────────────────────────
// Saves a single onboarding step's data + advances the step counter
const onboardingStepSchema = z.object({
  step: z.number().int().min(0).max(7),
  data: z.record(z.unknown()),
});

profileRouter.put('/onboarding', async (req, res, next) => {
  try {
    const { step, data } = onboardingStepSchema.parse(req.body);

    // Build the update payload from the step data
    const updatePayload: Record<string, unknown> = {
      onboardingStep: step + 1,
      updatedAt: new Date(),
    };

    // Map step-specific fields
    if (data.fitnessLevel !== undefined) updatePayload.fitnessLevel = data.fitnessLevel;
    if (data.goals !== undefined) updatePayload.goals = data.goals;
    if (data.trainingDaysPerWeek !== undefined) updatePayload.trainingDaysPerWeek = data.trainingDaysPerWeek;
    if (data.sessionDurationMin !== undefined) updatePayload.sessionDurationMin = data.sessionDurationMin;
    if (data.preferredEquipment !== undefined) updatePayload.preferredEquipment = data.preferredEquipment;
    if (data.injuryZones !== undefined) updatePayload.injuryZones = data.injuryZones;
    if (data.biologicalSex !== undefined) updatePayload.biologicalSex = data.biologicalSex;
    if (data.heightCm !== undefined) updatePayload.heightCm = data.heightCm;
    if (data.weightKg !== undefined) updatePayload.weightKg = data.weightKg;
    if (data.age !== undefined) updatePayload.age = data.age;
    if (data.bodyFatPercent !== undefined) updatePayload.bodyFatPercent = data.bodyFatPercent;

    // Final step — mark onboarding complete
    if (step >= 6) {
      updatePayload.onboardingCompleted = true;
    }

    const [updated] = await db.update(schema.userProfiles)
      .set(updatePayload)
      .where(eq(schema.userProfiles.userId, req.userId!))
      .returning();

    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Profile not found');
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
