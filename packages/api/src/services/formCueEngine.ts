import { eq } from 'drizzle-orm';
import { db, schema } from '@vibefit/core';

interface FormCue {
  phase: 'setup' | 'concentric' | 'eccentric' | 'breathing' | 'common-mistake';
  cue: string;
  priority: number; // 1 = most important
}

// Static form cue database keyed by movement pattern
const PATTERN_CUES: Record<string, FormCue[]> = {
  push: [
    { phase: 'setup', cue: 'Retract and depress your shoulder blades', priority: 1 },
    { phase: 'concentric', cue: 'Drive through the palm, not the fingers', priority: 2 },
    { phase: 'eccentric', cue: 'Control the descent — 2-3 seconds down', priority: 2 },
    { phase: 'breathing', cue: 'Inhale on the way down, exhale on the push', priority: 3 },
    { phase: 'common-mistake', cue: 'Avoid flaring elbows past 75 degrees', priority: 1 },
  ],
  pull: [
    { phase: 'setup', cue: 'Initiate the pull by squeezing your shoulder blades together', priority: 1 },
    { phase: 'concentric', cue: 'Lead with your elbows, not your hands', priority: 2 },
    { phase: 'eccentric', cue: 'Fully extend arms at the bottom — full range of motion', priority: 2 },
    { phase: 'breathing', cue: 'Exhale as you pull, inhale as you lower', priority: 3 },
    { phase: 'common-mistake', cue: 'Don\'t use momentum or swing your body', priority: 1 },
  ],
  squat: [
    { phase: 'setup', cue: 'Feet shoulder-width apart, toes slightly out', priority: 1 },
    { phase: 'concentric', cue: 'Drive through your heels, knees track over toes', priority: 1 },
    { phase: 'eccentric', cue: 'Sit back and down like you\'re sitting in a chair', priority: 2 },
    { phase: 'breathing', cue: 'Big breath at the top, brace core, exhale at the top of the rep', priority: 2 },
    { phase: 'common-mistake', cue: 'Don\'t let your knees cave inward', priority: 1 },
  ],
  hinge: [
    { phase: 'setup', cue: 'Soft bend in knees, neutral spine, hinge at the hips', priority: 1 },
    { phase: 'concentric', cue: 'Drive hips forward, squeeze glutes at lockout', priority: 1 },
    { phase: 'eccentric', cue: 'Push hips back, keep the bar close to your body', priority: 2 },
    { phase: 'breathing', cue: 'Brace core with a big breath before each rep', priority: 2 },
    { phase: 'common-mistake', cue: 'Don\'t round your lower back', priority: 1 },
  ],
  carry: [
    { phase: 'setup', cue: 'Stand tall, shoulders back and down', priority: 1 },
    { phase: 'concentric', cue: 'Walk with controlled, even steps', priority: 2 },
    { phase: 'breathing', cue: 'Breathe steadily, don\'t hold your breath', priority: 3 },
    { phase: 'common-mistake', cue: 'Don\'t lean to one side — stay balanced', priority: 1 },
  ],
  rotation: [
    { phase: 'setup', cue: 'Engage your core before rotating', priority: 1 },
    { phase: 'concentric', cue: 'Rotate through your thoracic spine, not your lower back', priority: 1 },
    { phase: 'eccentric', cue: 'Control the return — don\'t let gravity do the work', priority: 2 },
    { phase: 'common-mistake', cue: 'Keep your hips stable and facing forward', priority: 1 },
  ],
  isolation: [
    { phase: 'setup', cue: 'Stabilize the joint and focus on the target muscle', priority: 1 },
    { phase: 'concentric', cue: 'Squeeze at peak contraction for 1 second', priority: 2 },
    { phase: 'eccentric', cue: 'Slow, controlled negatives — 3 seconds down', priority: 2 },
    { phase: 'breathing', cue: 'Exhale during effort, inhale during the return', priority: 3 },
    { phase: 'common-mistake', cue: 'Don\'t use momentum to swing the weight', priority: 1 },
  ],
};

/**
 * Get form cues for an exercise based on its biomech profile.
 */
export async function getFormCues(exerciseId: string): Promise<{
  exerciseName: string;
  cues: FormCue[];
  tips: string[];
}> {
  const [exercise] = await db.select()
    .from(schema.exercises)
    .where(eq(schema.exercises.id, exerciseId))
    .limit(1);

  if (!exercise) {
    return { exerciseName: 'Unknown', cues: [], tips: [] };
  }

  const tags = exercise.biomechTags as { movementPattern?: string; compoundScore?: number; injuryRiskZones?: string[] } | null;
  const pattern = tags?.movementPattern ?? 'isolation';
  const cues = PATTERN_CUES[pattern] ?? PATTERN_CUES['isolation'];

  // Generate contextual tips
  const tips: string[] = [];

  if (tags?.compoundScore != null && tags.compoundScore >= 7) {
    tips.push('This is a compound movement — warm up with lighter sets first');
  }

  if (tags?.injuryRiskZones?.length) {
    tips.push(`Higher injury risk zones: ${tags.injuryRiskZones.join(', ')}. Use proper form!`);
  }

  if (exercise.difficulty === 'advanced') {
    tips.push('Advanced exercise — consider mastering easier variations first');
  }

  // Append exercise-specific instructions from DB
  if (exercise.instructions && Array.isArray(exercise.instructions)) {
    const instructions = exercise.instructions as string[];
    if (instructions.length > 0) {
      tips.push(...instructions.slice(0, 3));
    }
  }

  return {
    exerciseName: exercise.name,
    cues: cues.sort((a, b) => a.priority - b.priority),
    tips,
  };
}
