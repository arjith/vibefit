import { db, schema } from '@vibefit/core';
import { OVERLOAD_CONFIG } from '@vibefit/shared';

// ─── Goal-specific configuration (ported from GymVerse) ──────
interface GoalConfig {
  strengthRatio: number;
  cardioRatio: number;
  preferredIntensity: string[];
  preferFunCardio: boolean;
  compoundPriority: boolean;
  setsRange: [number, number];
  repsRange: [number, number];
  restRange: [number, number];
}

const goalConfigs: Record<string, GoalConfig> = {
  'weight-loss': {
    strengthRatio: 0.4, cardioRatio: 0.6,
    preferredIntensity: ['hiit', 'high'], preferFunCardio: true,
    compoundPriority: true,
    setsRange: [3, 4], repsRange: [12, 15], restRange: [30, 60],
  },
  'muscle-building': {
    strengthRatio: 0.85, cardioRatio: 0.15,
    preferredIntensity: ['low', 'moderate'], preferFunCardio: false,
    compoundPriority: true,
    setsRange: [3, 5], repsRange: [6, 12], restRange: [60, 120],
  },
  strength: {
    strengthRatio: 0.9, cardioRatio: 0.1,
    preferredIntensity: ['low'], preferFunCardio: false,
    compoundPriority: true,
    setsRange: [4, 5], repsRange: [3, 6], restRange: [120, 180],
  },
  endurance: {
    strengthRatio: 0.35, cardioRatio: 0.65,
    preferredIntensity: ['moderate', 'high'], preferFunCardio: true,
    compoundPriority: false,
    setsRange: [2, 3], repsRange: [15, 20], restRange: [30, 45],
  },
  flexibility: {
    strengthRatio: 0.3, cardioRatio: 0.7,
    preferredIntensity: ['low', 'moderate'], preferFunCardio: true,
    compoundPriority: false,
    setsRange: [2, 3], repsRange: [10, 15], restRange: [30, 60],
  },
  'general-fitness': {
    strengthRatio: 0.5, cardioRatio: 0.5,
    preferredIntensity: ['moderate', 'high'], preferFunCardio: true,
    compoundPriority: true,
    setsRange: [3, 4], repsRange: [10, 12], restRange: [45, 90],
  },
  'athletic-performance': {
    strengthRatio: 0.6, cardioRatio: 0.4,
    preferredIntensity: ['high', 'hiit'], preferFunCardio: false,
    compoundPriority: true,
    setsRange: [3, 5], repsRange: [5, 10], restRange: [60, 120],
  },
};

// ─── Day focus templates by days per week ────────────────────
const dayFocusTemplates: Record<number, string[][]> = {
  2: [['Upper Body', 'Lower Body & Core']],
  3: [
    ['Push Day (Chest & Shoulders)', 'Pull Day (Back & Arms)', 'Legs & Core'],
    ['Upper Body', 'Lower Body & Core', 'Full Body + Cardio'],
  ],
  4: [
    ['Push Day (Chest & Shoulders)', 'Pull Day (Back & Arms)', 'Legs & Glutes', 'Core & Cardio Fun Day'],
  ],
  5: [
    ['Chest & Triceps', 'Back & Biceps', 'Legs & Glutes', 'Shoulders & Core', 'Cardio Fun Day'],
  ],
  6: [
    ['Push (Chest & Shoulders)', 'Pull (Back & Biceps)', 'Legs',
     'Push (Shoulders & Triceps)', 'Pull (Back & Core)', 'Legs & Cardio Fun'],
  ],
};

// ─── Helpers ─────────────────────────────────────────────────
type MuscleGroup = string;

function getMuscleGroupsForFocus(focus: string): MuscleGroup[] {
  const lower = focus.toLowerCase();
  const groups: MuscleGroup[] = [];

  if (lower.includes('chest')) groups.push('chest');
  if (lower.includes('back')) groups.push('back');
  if (lower.includes('shoulder')) groups.push('shoulders');
  if (lower.includes('leg')) groups.push('legs');
  if (lower.includes('arm') || lower.includes('bicep') || lower.includes('tricep')) groups.push('arms');
  if (lower.includes('core')) groups.push('core');
  if (lower.includes('glute')) groups.push('glutes');
  if (lower.includes('full body') || lower.includes('upper body'))
    groups.push('chest', 'back', 'shoulders', 'arms');
  if (lower.includes('lower body')) groups.push('legs', 'glutes');
  if (lower.includes('push')) {
    if (!groups.includes('chest')) groups.push('chest');
    if (!groups.includes('shoulders')) groups.push('shoulders');
  }
  if (lower.includes('pull')) {
    if (!groups.includes('back')) groups.push('back');
    if (!groups.includes('arms')) groups.push('arms');
  }

  return groups.length > 0 ? groups : ['full-body'];
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatGoalName(goal: string): string {
  return goal.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ─── DB exercise type ────────────────────────────────────────
interface DbExercise {
  id: string;
  name: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: string;
  instructions: string[];
  tips: string[];
  imageUrl: string;
  imageUrls: string[];
  tags: string[];
  alternateExerciseIds: string[];
}

// ─── Routine generation request ──────────────────────────────
export interface GenerateRoutineRequest {
  goal: string;
  daysPerWeek: number;
  sessionDurationMin: number;
  fitnessLevel: string;
  availableEquipment: string[];
  totalWeeks?: number;
}

// ─── Generated routine shape (before DB persist) ─────────────
interface GeneratedExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  equipment: string;
  imageUrls: string[];
  instructions: string[];
  tips: string[];
  sets: number;
  reps: number;
  restSeconds: number;
  targetWeight: number | null;
  order: number;
  alternateIds: string[];
}

// Progressive overload helper
function isUpperBodyMuscle(group: string): boolean {
  return ['chest', 'back', 'shoulders', 'arms'].includes(group);
}

interface GeneratedDay {
  dayNumber: number;
  focus: string;
  isRestDay: boolean;
  exercises: GeneratedExercise[];
}

interface GeneratedWeek {
  weekNumber: number;
  isDeload: boolean;
  days: GeneratedDay[];
}

export interface GeneratedRoutine {
  name: string;
  goal: string;
  daysPerWeek: number;
  sessionDurationMin: number;
  fitnessLevel: string;
  availableEquipment: string[];
  totalWeeks: number;
  weeks: GeneratedWeek[];
}

// ─── Main generator ─────────────────────────────────────────
export async function generateRoutinePreview(request: GenerateRoutineRequest): Promise<GeneratedRoutine> {
  const config = goalConfigs[request.goal] ?? goalConfigs['general-fitness'];
  const days = Math.min(Math.max(request.daysPerWeek, 2), 6);
  const totalWeeks = request.totalWeeks ?? 4;
  const overloadCfg = OVERLOAD_CONFIG[request.fitnessLevel as keyof typeof OVERLOAD_CONFIG]
    ?? OVERLOAD_CONFIG.beginner;

  // Load exercises from DB
  const allExercises = await db.select().from(schema.exercises) as unknown as DbExercise[];

  // Select day focus template
  const templates = dayFocusTemplates[days] ?? dayFocusTemplates[3];
  const focusTemplate = templates[Math.floor(Math.random() * templates.length)];

  // Calculate exercises per session
  const strengthMinutes = Math.round(request.sessionDurationMin * config.strengthRatio);
  const avgExerciseMinutes = 5;
  const exercisesPerDay = Math.max(3, Math.min(8, Math.floor(strengthMinutes / avgExerciseMinutes)));

  // Build exercise pool for each day focus (consistent across weeks)
  const dayPools = focusTemplate.map((focus) => {
    const targetMuscles = getMuscleGroupsForFocus(focus);

    let pool = allExercises.filter((e) =>
      targetMuscles.includes(e.muscleGroup) ||
      (e.secondaryMuscles ?? []).some((m: string) => targetMuscles.includes(m))
    );

    if (request.availableEquipment.length > 0) {
      pool = pool.filter((e) =>
        request.availableEquipment.includes(e.equipment)
        || e.equipment === 'bodyweight'
        || e.equipment === 'none'
      );
    }

    if (request.fitnessLevel === 'beginner') {
      pool = pool.filter((e) => e.difficulty === 'beginner' || e.difficulty === 'intermediate');
    }

    if (config.compoundPriority && pool.length >= exercisesPerDay) {
      const compounds = pool.filter((e) => (e.tags ?? []).includes('compound'));
      const isolations = pool.filter((e) => !(e.tags ?? []).includes('compound'));
      const compoundCount = Math.ceil(exercisesPerDay * 0.6);
      const isoCount = exercisesPerDay - compoundCount;
      pool = [...pickRandom(compounds, compoundCount), ...pickRandom(isolations, isoCount)];
    } else {
      pool = pickRandom(pool, exercisesPerDay);
    }

    if (pool.length < 3) {
      const fallback = allExercises.filter((e) =>
        e.muscleGroup === 'full-body' || (e.tags ?? []).includes('compound')
      );
      pool = [...pool, ...pickRandom(fallback, 3 - pool.length)];
    }

    return pool.slice(0, exercisesPerDay);
  });

  // Generate all weeks with progressive overload
  const weeks: GeneratedWeek[] = [];
  for (let w = 1; w <= totalWeeks; w++) {
    const isDeload = w > 1 && w % 4 === 0;
    const deloadFactor = isDeload ? 0.6 : 1;
    const weekWeightBump = isDeload ? 0 : w - 1;

    const weekDays: GeneratedDay[] = focusTemplate.map((focus, idx) => {
      const pool = dayPools[idx];

      const exercises: GeneratedExercise[] = pool.map((ex, order) => {
        const sets = Math.max(1,
          Math.round(randomInRange(config.setsRange[0], config.setsRange[1]) * deloadFactor),
        );
        const reps = Math.max(1,
          Math.round(randomInRange(config.repsRange[0], config.repsRange[1]) * (isDeload ? 0.8 : 1)),
        );

        // Progressive overload: increment weight per non-deload week
        const isUpper = isUpperBodyMuscle(ex.muscleGroup);
        const increment = isUpper
          ? overloadCfg.upperBodyWeightIncreaseLb
          : overloadCfg.lowerBodyWeightIncreaseLb;
        const targetWeight = weekWeightBump > 0 ? weekWeightBump * increment : null;

        return {
          exerciseId: ex.id,
          exerciseName: ex.name,
          muscleGroup: ex.muscleGroup,
          equipment: ex.equipment,
          imageUrls: ex.imageUrls ?? [],
          instructions: ex.instructions ?? [],
          tips: ex.tips ?? [],
          sets,
          reps,
          restSeconds: randomInRange(config.restRange[0], config.restRange[1]),
          targetWeight,
          order: order + 1,
          alternateIds: ex.alternateExerciseIds ?? [],
        };
      });

      return { dayNumber: idx + 1, focus, isRestDay: false, exercises };
    });

    weeks.push({ weekNumber: w, isDeload, days: weekDays });
  }

  return {
    name: `${formatGoalName(request.goal)} – ${days} Day Plan`,
    goal: request.goal,
    daysPerWeek: days,
    sessionDurationMin: request.sessionDurationMin,
    fitnessLevel: request.fitnessLevel,
    availableEquipment: request.availableEquipment,
    totalWeeks,
    weeks,
  };
}

// ─── Persist routine to DB ───────────────────────────────────
export async function persistRoutine(preview: GeneratedRoutine, userId: string) {
  // Insert routine
  const [routine] = await db.insert(schema.routines).values({
    userId,
    name: preview.name,
    goal: preview.goal,
    daysPerWeek: preview.daysPerWeek,
    sessionDurationMin: preview.sessionDurationMin,
    fitnessLevel: preview.fitnessLevel,
    availableEquipment: preview.availableEquipment,
    totalWeeks: preview.totalWeeks,
    status: 'active',
  }).returning();

  // Insert weeks → days → exercises
  for (const week of preview.weeks) {
    const [dbWeek] = await db.insert(schema.routineWeeks).values({
      routineId: routine.id,
      weekNumber: week.weekNumber,
      isDeload: week.isDeload,
    }).returning();

    for (const day of week.days) {
      const [dbDay] = await db.insert(schema.routineDays).values({
        weekId: dbWeek.id,
        dayNumber: day.dayNumber,
        focus: day.focus,
        isRestDay: day.isRestDay,
      }).returning();

      if (day.exercises.length > 0) {
        await db.insert(schema.routineExercises).values(
          day.exercises.map((ex) => ({
            dayId: dbDay.id,
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

  return routine;
}
