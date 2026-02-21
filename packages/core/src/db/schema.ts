import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  real,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ─── Users ───────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  refreshToken: text('refresh_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── User Profiles ───────────────────────────────────────────
export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  fitnessLevel: varchar('fitness_level', { length: 20 }).notNull().default('beginner'),
  biologicalSex: varchar('biological_sex', { length: 20 }),
  heightCm: real('height_cm'),
  weightKg: real('weight_kg'),
  age: integer('age'),
  bodyFatPercent: real('body_fat_percent'),
  preferredEquipment: jsonb('preferred_equipment').notNull().default([]),
  goals: jsonb('goals').notNull().default([]),
  injuryZones: jsonb('injury_zones').notNull().default([]),
  trainingDaysPerWeek: integer('training_days_per_week').notNull().default(3),
  sessionDurationMin: integer('session_duration_min').notNull().default(45),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  onboardingStep: integer('onboarding_step').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Exercises ───────────────────────────────────────────────
export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  muscleGroup: varchar('muscle_group', { length: 50 }).notNull(),
  secondaryMuscles: jsonb('secondary_muscles').notNull().default([]),
  equipment: varchar('equipment', { length: 50 }).notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  instructions: jsonb('instructions').notNull().default([]),
  tips: jsonb('tips').notNull().default([]),
  imageUrls: jsonb('image_urls').notNull().default([]),
  tags: jsonb('tags').notNull().default([]),
  alternateExerciseIds: jsonb('alternate_exercise_ids').notNull().default([]),
  biomechTags: jsonb('biomech_tags'),
  // pgvector embedding for similarity search — added via raw SQL migration
  // embedding: vector('embedding', { dimensions: 384 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  muscleGroupIdx: index('exercises_muscle_group_idx').on(table.muscleGroup),
  equipmentIdx: index('exercises_equipment_idx').on(table.equipment),
  difficultyIdx: index('exercises_difficulty_idx').on(table.difficulty),
  nameIdx: index('exercises_name_idx').on(table.name),
}));

// ─── Cardio Activities ───────────────────────────────────────
export const cardioActivities = pgTable('cardio_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  funRating: integer('fun_rating').notNull(),
  intensityLevel: varchar('intensity_level', { length: 20 }).notNull(),
  caloriesPerHour: integer('calories_per_hour').notNull(),
  durationMin: integer('duration_min').notNull(),
  description: text('description').notNull(),
  howToStart: text('how_to_start').notNull(),
  imageUrl: text('image_url').notNull(),
  tags: jsonb('tags').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('cardio_category_idx').on(table.category),
  intensityIdx: index('cardio_intensity_idx').on(table.intensityLevel),
}));

// ─── Routines ────────────────────────────────────────────────
export const routines = pgTable('routines', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  goal: varchar('goal', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('generated'),
  daysPerWeek: integer('days_per_week').notNull(),
  sessionDurationMin: integer('session_duration_min').notNull(),
  fitnessLevel: varchar('fitness_level', { length: 20 }).notNull(),
  availableEquipment: jsonb('available_equipment').notNull().default([]),
  totalWeeks: integer('total_weeks').notNull().default(4),
  currentWeek: integer('current_week').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdx: index('routines_user_idx').on(table.userId),
  statusIdx: index('routines_status_idx').on(table.status),
}));

// ─── Routine Weeks ───────────────────────────────────────────
export const routineWeeks = pgTable('routine_weeks', {
  id: uuid('id').primaryKey().defaultRandom(),
  routineId: uuid('routine_id').notNull().references(() => routines.id, { onDelete: 'cascade' }),
  weekNumber: integer('week_number').notNull(),
  isDeload: boolean('is_deload').notNull().default(false),
}, (table) => ({
  routineWeekIdx: uniqueIndex('routine_week_unique_idx').on(table.routineId, table.weekNumber),
}));

// ─── Routine Days ────────────────────────────────────────────
export const routineDays = pgTable('routine_days', {
  id: uuid('id').primaryKey().defaultRandom(),
  weekId: uuid('week_id').notNull().references(() => routineWeeks.id, { onDelete: 'cascade' }),
  dayNumber: integer('day_number').notNull(),
  focus: varchar('focus', { length: 100 }).notNull(),
  isRestDay: boolean('is_rest_day').notNull().default(false),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// ─── Routine Exercises ───────────────────────────────────────
export const routineExercises = pgTable('routine_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  dayId: uuid('day_id').notNull().references(() => routineDays.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id),
  order: integer('order').notNull(),
  sets: integer('sets').notNull(),
  reps: integer('reps').notNull(),
  restSeconds: integer('rest_seconds').notNull(),
  targetWeight: real('target_weight'),
  alternateIds: jsonb('alternate_ids').notNull().default([]),
});

// ─── Workout Sessions ────────────────────────────────────────
export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  routineId: uuid('routine_id').notNull().references(() => routines.id),
  weekNumber: integer('week_number').notNull(),
  dayNumber: integer('day_number').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('scheduled'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  pausedAt: timestamp('paused_at', { withTimezone: true }),
  totalDurationSec: integer('total_duration_sec').notNull().default(0),
  rpe: integer('rpe'),
  mood: integer('mood'),
  notes: text('notes'),
  skippedExercises: jsonb('skipped_exercises').notNull().default([]),
  personalRecords: jsonb('personal_records').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userSessionIdx: index('sessions_user_idx').on(table.userId),
  routineSessionIdx: index('sessions_routine_idx').on(table.routineId),
  statusSessionIdx: index('sessions_status_idx').on(table.status),
}));

// ─── Workout Sets ────────────────────────────────────────────
export const workoutSets = pgTable('workout_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id),
  setNumber: integer('set_number').notNull(),
  weight: real('weight').notNull(),
  reps: integer('reps').notNull(),
  rpe: integer('rpe'),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
  isWarmup: boolean('is_warmup').notNull().default(false),
  isDropSet: boolean('is_drop_set').notNull().default(false),
});

// ─── Exercise History (per-user progress) ────────────────────
export const exerciseHistory = pgTable('exercise_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id),
  timesPerformed: integer('times_performed').notNull().default(0),
  personalBestWeight: real('personal_best_weight'),
  personalBestReps: integer('personal_best_reps'),
  personalBestDate: timestamp('personal_best_date', { withTimezone: true }),
  lastPerformed: timestamp('last_performed', { withTimezone: true }),
  mastery: varchar('mastery', { length: 20 }).notNull().default('discovery'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userExerciseIdx: uniqueIndex('user_exercise_unique_idx').on(table.userId, table.exerciseId),
}));

// ─── Streaks ─────────────────────────────────────────────────
export const streaks = pgTable('streaks', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastActivityDate: timestamp('last_activity_date', { withTimezone: true }),
  freezesUsedThisWeek: integer('freezes_used_this_week').notNull().default(0),
  freezesAvailable: integer('freezes_available').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Achievements ────────────────────────────────────────────
export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 30 }).notNull(),
  rarity: varchar('rarity', { length: 20 }).notNull(),
  iconUrl: text('icon_url').notNull().default(''),
  requirement: text('requirement').notNull(),
});

export const userAchievements = pgTable('user_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: uuid('achievement_id').notNull().references(() => achievements.id),
  progress: integer('progress').notNull().default(0),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }),
}, (table) => ({
  userAchievementIdx: uniqueIndex('user_achievement_unique_idx').on(table.userId, table.achievementId),
}));

// ─── Challenges ──────────────────────────────────────────────
export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  target: integer('target').notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

export const userChallenges = pgTable('user_challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  challengeId: uuid('challenge_id').notNull().references(() => challenges.id),
  currentProgress: integer('current_progress').notNull().default(0),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userChallengeIdx: uniqueIndex('user_challenge_unique_idx').on(table.userId, table.challengeId),
}));
