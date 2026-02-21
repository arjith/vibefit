import { db } from './index';
import { exercises, cardioActivities, achievements, users, userProfiles, streaks } from './schema';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { hash } from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface GymVerseExercise {
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

interface GymVerseCardio {
  id: string;
  name: string;
  category: string;
  funRating: number;
  intensityLevel: string;
  caloriesPerHour: number;
  durationMin: number;
  description: string;
  howToStart: string;
  imageUrl: string;
  tags: string[];
}

async function seed() {
  console.log('Seeding VibeFit database...\n');

  // ── 1. Exercises (64 from GymVerse) ──
  const exerciseData: GymVerseExercise[] = JSON.parse(
    readFileSync(join(__dirname, 'seed', 'exercises.json'), 'utf-8')
  );

  console.log(`Inserting ${exerciseData.length} exercises...`);
  for (const ex of exerciseData) {
    await db.insert(exercises).values({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      secondaryMuscles: ex.secondaryMuscles,
      equipment: ex.equipment,
      difficulty: ex.difficulty,
      instructions: ex.instructions,
      tips: ex.tips,
      imageUrls: ex.imageUrls ?? (ex.imageUrl ? [ex.imageUrl] : []),
      tags: ex.tags,
      alternateExerciseIds: ex.alternateExerciseIds,
      biomechTags: null,
    }).onConflictDoNothing();
  }
  console.log(`  ✓ ${exerciseData.length} exercises inserted`);

  // ── 2. Cardio Activities (37 from GymVerse) ──
  const cardioData: GymVerseCardio[] = JSON.parse(
    readFileSync(join(__dirname, 'seed', 'cardio.json'), 'utf-8')
  );

  console.log(`Inserting ${cardioData.length} cardio activities...`);
  for (const c of cardioData) {
    await db.insert(cardioActivities).values({
      name: c.name,
      category: c.category,
      funRating: c.funRating,
      intensityLevel: c.intensityLevel,
      caloriesPerHour: c.caloriesPerHour,
      durationMin: c.durationMin,
      description: c.description,
      howToStart: c.howToStart,
      imageUrl: c.imageUrl,
      tags: c.tags,
    }).onConflictDoNothing();
  }
  console.log(`  ✓ ${cardioData.length} cardio activities inserted`);

  // ── 3. Demo user ──
  console.log('Creating demo user...');
  const passwordHash = await hash('password123', 12);
  const [demoUser] = await db.insert(users).values({
    email: 'demo@vibefit.app',
    name: 'Demo User',
    passwordHash,
  }).onConflictDoNothing().returning();

  if (demoUser) {
    await db.insert(userProfiles).values({
      userId: demoUser.id,
      fitnessLevel: 'intermediate',
      heightCm: 178,
      weightKg: 80,
      age: 28,
      preferredEquipment: ['barbell', 'dumbbell', 'cable', 'bodyweight'],
      goals: ['muscle_gain', 'strength'],
      injuryZones: [],
      trainingDaysPerWeek: 4,
      sessionDurationMin: 60,
      onboardingCompleted: true,
      onboardingStep: 8,
    });

    await db.insert(streaks).values({
      userId: demoUser.id,
      currentStreak: 7,
      longestStreak: 14,
      lastActivityDate: new Date(),
      freezesUsedThisWeek: 0,
      freezesAvailable: 1,
    });
    console.log('  ✓ Demo user created (demo@vibefit.app / password123)');
  } else {
    console.log('  ⚠ Demo user already exists, skipping');
  }

  // ── 4. Starter achievements ──
  console.log('Inserting starter achievements...');
  const starterAchievements = [
    { name: 'First Steps', description: 'Complete your first workout', category: 'milestone', rarity: 'common', requirement: 'workouts >= 1' },
    { name: 'First Week', description: 'Maintain a 7-day streak', category: 'streak', rarity: 'common', requirement: 'streak >= 7' },
    { name: 'Iron Will', description: 'Maintain a 30-day streak', category: 'streak', rarity: 'rare', requirement: 'streak >= 30' },
    { name: 'Century Club', description: 'Maintain a 100-day streak', category: 'streak', rarity: 'legendary', requirement: 'streak >= 100' },
    { name: 'Personal Best', description: 'Set your first personal record', category: 'milestone', rarity: 'common', requirement: 'prs >= 1' },
    { name: 'PR Machine', description: 'Set 25 personal records', category: 'milestone', rarity: 'rare', requirement: 'prs >= 25' },
    { name: 'Explorer', description: 'Try 20 different exercises', category: 'variety', rarity: 'uncommon', requirement: 'unique_exercises >= 20' },
    { name: 'Jack of All Trades', description: 'Try 50 different exercises', category: 'variety', rarity: 'rare', requirement: 'unique_exercises >= 50' },
    { name: 'Bench Baron', description: 'Bench press your bodyweight', category: 'strength', rarity: 'uncommon', requirement: 'bench_1rm >= bodyweight' },
    { name: 'Plate Milestone', description: 'Reach a 1-plate bench (135 lbs)', category: 'strength', rarity: 'uncommon', requirement: 'bench_1rm >= 135' },
    { name: 'Two Plates', description: 'Reach a 2-plate bench (225 lbs)', category: 'strength', rarity: 'rare', requirement: 'bench_1rm >= 225' },
    { name: 'Marathon Month', description: 'Log 20 workouts in a month', category: 'volume', rarity: 'rare', requirement: 'monthly_workouts >= 20' },
    { name: 'Dawn Warrior', description: 'Complete 10 workouts before 7 AM', category: 'habit', rarity: 'uncommon', requirement: 'early_workouts >= 10' },
    { name: 'Night Owl', description: 'Complete 10 workouts after 9 PM', category: 'habit', rarity: 'uncommon', requirement: 'late_workouts >= 10' },
    { name: 'Full Body Focus', description: 'Train all 7 muscle groups in a week', category: 'variety', rarity: 'common', requirement: 'weekly_muscle_groups >= 7' },
  ];

  for (const a of starterAchievements) {
    await db.insert(achievements).values({
      ...a,
      iconUrl: '',
    }).onConflictDoNothing();
  }
  console.log(`  ✓ ${starterAchievements.length} achievements inserted`);

  console.log('\n✅ Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
