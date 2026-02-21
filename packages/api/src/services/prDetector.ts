import { eq, and } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';

export interface PersonalRecord {
  exerciseId: string;
  type: 'weight' | 'reps';
  previousBest: number | null;
  newBest: number;
}

/**
 * After logging a set, check if it constitutes a personal record.
 * Updates exerciseHistory accordingly and returns any PRs hit.
 */
export async function detectPersonalRecords(
  userId: string,
  exerciseId: string,
  weight: number,
  reps: number,
): Promise<PersonalRecord[]> {
  const prs: PersonalRecord[] = [];

  // Upsert exercise history
  let [history] = await db.select()
    .from(schema.exerciseHistory)
    .where(and(
      eq(schema.exerciseHistory.userId, userId),
      eq(schema.exerciseHistory.exerciseId, exerciseId),
    ))
    .limit(1);

  const now = new Date();

  if (!history) {
    // First time performing this exercise — everything is a PR
    [history] = await db.insert(schema.exerciseHistory).values({
      userId,
      exerciseId,
      timesPerformed: 1,
      personalBestWeight: weight,
      personalBestReps: reps,
      personalBestDate: now,
      lastPerformed: now,
      mastery: 'discovery',
    }).returning();

    if (weight > 0) prs.push({ exerciseId, type: 'weight', previousBest: null, newBest: weight });
    if (reps > 0) prs.push({ exerciseId, type: 'reps', previousBest: null, newBest: reps });
    return prs;
  }

  // Track what to update
  const updates: Partial<typeof schema.exerciseHistory.$inferInsert> = {
    timesPerformed: history.timesPerformed + 1,
    lastPerformed: now,
    updatedAt: now,
  };

  // Weight PR check
  if (weight > (history.personalBestWeight ?? 0)) {
    prs.push({ exerciseId, type: 'weight', previousBest: history.personalBestWeight, newBest: weight });
    updates.personalBestWeight = weight;
    updates.personalBestDate = now;
  }

  // Reps PR check (same or higher weight)
  if (reps > (history.personalBestReps ?? 0)) {
    prs.push({ exerciseId, type: 'reps', previousBest: history.personalBestReps, newBest: reps });
    updates.personalBestReps = reps;
    if (!updates.personalBestDate) updates.personalBestDate = now;
  }

  // Update mastery based on times performed
  const tp = updates.timesPerformed as number;
  if (tp >= 50) updates.mastery = 'expert';
  else if (tp >= 25) updates.mastery = 'proficient';
  else if (tp >= 10) updates.mastery = 'familiar';
  else if (tp >= 3) updates.mastery = 'learning';

  await db.update(schema.exerciseHistory)
    .set(updates)
    .where(and(
      eq(schema.exerciseHistory.userId, userId),
      eq(schema.exerciseHistory.exerciseId, exerciseId),
    ));

  return prs;
}
