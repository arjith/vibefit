import { eq, and, ne } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';

interface BiomechTags {
  jointStress: Record<string, number>;
  mobilityRequired: string[];
  injuryRiskZones: string[];
  movementPattern: string;
  compoundScore: number;
}

interface SubstitutionResult {
  exerciseId: string;
  name: string;
  score: number;
  reason: string;
}

/**
 * Find exercise substitutions based on biomechanical compatibility.
 * Avoids exercises that stress injured zones and prefers similar movement patterns.
 */
export async function findSubstitutions(
  exerciseId: string,
  userInjuries: string[] = [],
  limit = 5,
): Promise<SubstitutionResult[]> {
  // Get the source exercise
  const [source] = await db.select()
    .from(schema.exercises)
    .where(eq(schema.exercises.id, exerciseId))
    .limit(1);

  if (!source) return [];

  const sourceTags = source.biomechTags as BiomechTags | null;

  // Get all exercises in the same muscle group that aren't the source
  const candidates = await db.select()
    .from(schema.exercises)
    .where(and(
      ne(schema.exercises.id, exerciseId),
      eq(schema.exercises.muscleGroup, source.muscleGroup),
    ));

  // Score each candidate
  const scored: SubstitutionResult[] = [];

  for (const candidate of candidates) {
    const tags = candidate.biomechTags as BiomechTags | null;
    let score = 50; // Base score
    const reasons: string[] = [];

    // Same movement pattern bonus
    if (sourceTags?.movementPattern && tags?.movementPattern === sourceTags.movementPattern) {
      score += 20;
      reasons.push('same movement pattern');
    }

    // Similar compound score (+/- 2)
    if (sourceTags?.compoundScore != null && tags?.compoundScore != null) {
      const diff = Math.abs(sourceTags.compoundScore - tags.compoundScore);
      if (diff <= 2) {
        score += 10;
        reasons.push('similar complexity');
      }
    }

    // Penalty for exercises that stress injured zones
    if (userInjuries.length > 0 && tags?.injuryRiskZones) {
      const conflicts = tags.injuryRiskZones.filter((zone) =>
        userInjuries.some((inj) => zone.toLowerCase().includes(inj.toLowerCase())),
      );
      if (conflicts.length > 0) {
        score -= 30 * conflicts.length;
        reasons.push(`stresses injured: ${conflicts.join(', ')}`);
      }
    }

    // Bonus for lower joint stress on injured joints
    if (userInjuries.length > 0 && tags?.jointStress) {
      const safeJoints = Object.entries(tags.jointStress).every(([joint, stress]) => {
        const isInjuredJoint = userInjuries.some((inj) => joint.toLowerCase().includes(inj.toLowerCase()));
        return !isInjuredJoint || stress <= 3;
      });
      if (safeJoints) {
        score += 15;
        reasons.push('low stress on injured joints');
      }
    }

    // Same difficulty bonus
    if (candidate.difficulty === source.difficulty) {
      score += 5;
      reasons.push('same difficulty');
    }

    if (score > 0) {
      scored.push({
        exerciseId: candidate.id,
        name: candidate.name,
        score: Math.max(0, Math.min(100, score)),
        reason: reasons.join('; ') || 'same muscle group',
      });
    }
  }

  // Sort by score descending and take top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
