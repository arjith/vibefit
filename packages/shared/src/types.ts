// ─── Entity State Machine ─────────────────────────────────────
export type EntityStatus =
  | 'initial'
  | 'loading'
  | 'loaded'
  | 'empty'
  | 'error'
  | 'partial'
  | 'stale'
  | 'offline';

export interface EntityState<T> {
  data: T;
  status: EntityStatus;
  error: string | null;
  lastFetched: number | null;
  retryCount: number;
}

// ─── User & Profile ──────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type BiologicalSex = 'male' | 'female' | 'other' | 'prefer-not-to-say';

export interface UserProfile {
  userId: string;
  fitnessLevel: FitnessLevel;
  biologicalSex: BiologicalSex | null;
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  bodyFatPercent: number | null;
  preferredEquipment: EquipmentType[];
  goals: FitnessGoal[];
  injuryZones: InjuryZone[];
  trainingDaysPerWeek: number;
  sessionDurationMin: number;
  onboardingCompleted: boolean;
  onboardingStep: number;
  createdAt: string;
  updatedAt: string;
}

export interface InjuryZone {
  bodyPart: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes: string | null;
}

// ─── Exercise ────────────────────────────────────────────────
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'legs'
  | 'arms'
  | 'core'
  | 'glutes'
  | 'full-body';

export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance-band'
  | 'none';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type ExerciseMastery = 'discovery' | 'learning' | 'practicing' | 'mastered';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  difficulty: Difficulty;
  instructions: string[];
  tips: string[];
  imageUrls: string[];
  tags: string[];
  alternateExerciseIds: string[];
  // Biomechanical metadata
  biomechTags: BiomechTags | null;
  // User-specific (populated per-user)
  mastery?: ExerciseMastery;
  timesPerformed?: number;
  personalBest?: PersonalBest | null;
  lastPerformed?: string | null;
}

export interface BiomechTags {
  jointStress: Record<string, number>; // e.g. { knee: 7, shoulder: 3 }
  mobilityRequired: string[];
  injuryRiskZones: string[];
  movementPattern: 'push' | 'pull' | 'squat' | 'hinge' | 'carry' | 'rotation' | 'isolation';
  compoundScore: number; // 0-10, how compound the movement is
}

export interface PersonalBest {
  weight: number;
  reps: number;
  date: string;
  exerciseId: string;
}

// ─── Cardio Activity ─────────────────────────────────────────
export type CardioCategory =
  | 'dance'
  | 'sports'
  | 'outdoor'
  | 'playful'
  | 'traditional'
  | 'mind-body';

export type IntensityLevel = 'low' | 'moderate' | 'high' | 'hiit';
export type CardioMastery = 'discovered' | 'tried' | 'regular' | 'favorite';

export interface CardioActivity {
  id: string;
  name: string;
  category: CardioCategory;
  funRating: number; // 1-5
  intensityLevel: IntensityLevel;
  caloriesPerHour: number;
  durationMin: number;
  description: string;
  howToStart: string;
  imageUrl: string;
  tags: string[];
  mastery?: CardioMastery;
}

// ─── Routine & Program ──────────────────────────────────────
export type FitnessGoal =
  | 'muscle-building'
  | 'strength'
  | 'weight-loss'
  | 'endurance'
  | 'flexibility'
  | 'athletic-performance'
  | 'general-fitness';

export type RoutineStatus =
  | 'generated'
  | 'previewing'
  | 'active'
  | 'in-progress'
  | 'completed'
  | 'archived';

export interface Routine {
  id: string;
  userId: string;
  name: string;
  goal: FitnessGoal;
  status: RoutineStatus;
  daysPerWeek: number;
  sessionDurationMin: number;
  fitnessLevel: FitnessLevel;
  availableEquipment: EquipmentType[];
  totalWeeks: number;
  currentWeek: number;
  weeks: RoutineWeek[];
  createdAt: string;
  updatedAt: string;
}

export interface RoutineWeek {
  weekNumber: number;
  isDeload: boolean;
  days: RoutineDay[];
}

export interface RoutineDay {
  dayNumber: number;
  focus: string;
  exercises: RoutineExercise[];
  cardio: RoutineCardio | null;
  isRestDay: boolean;
  completed: boolean;
  completedAt: string | null;
}

export interface RoutineExercise {
  exerciseId: string;
  order: number;
  sets: number;
  reps: number;
  restSeconds: number;
  targetWeight: number | null;
  alternateIds: string[];
  // Enriched (hydrated from exercise data)
  exerciseName?: string;
  imageUrls?: string[];
  muscleGroup?: MuscleGroup;
  equipment?: EquipmentType;
  instructions?: string[];
  tips?: string[];
}

export interface RoutineCardio {
  activityId: string;
  durationMin: number;
  targetIntensity: IntensityLevel;
  // Enriched
  activityName?: string;
  imageUrl?: string;
}

// ─── Workout Session (live tracking) ─────────────────────────
export type WorkoutStatus =
  | 'scheduled'
  | 'ready'
  | 'in-progress'
  | 'paused'
  | 'completed'
  | 'reviewed';

export interface WorkoutSession {
  id: string;
  userId: string;
  routineId: string;
  weekNumber: number;
  dayNumber: number;
  status: WorkoutStatus;
  startedAt: string | null;
  completedAt: string | null;
  pausedAt: string | null;
  totalDurationSec: number;
  sets: WorkoutSet[];
  cardioLog: CardioLog | null;
  rpe: number | null; // 1-10 overall session RPE
  mood: number | null; // 1-5
  notes: string | null;
  skippedExercises: SkippedExercise[];
  personalRecords: PersonalBest[];
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number | null;
  completedAt: string;
  isWarmup: boolean;
  isDropSet: boolean;
}

export interface CardioLog {
  activityId: string;
  durationMin: number;
  distance: number | null;
  avgHeartRate: number | null;
  caloriesBurned: number | null;
  rpe: number | null;
}

export type SkipReason = 'no-equipment' | 'injury' | 'time' | 'fatigue' | 'other';

export interface SkippedExercise {
  exerciseId: string;
  reason: SkipReason;
  substituteId: string | null;
}

// ─── Streak & Gamification ───────────────────────────────────
export interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  freezesUsedThisWeek: number;
  freezesAvailable: number;
  milestones: StreakMilestone[];
}

export type StreakMilestoneType = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface StreakMilestone {
  days: number;
  type: StreakMilestoneType;
  unlockedAt: string | null;
}

export type AchievementCategory =
  | 'consistency'
  | 'strength'
  | 'exploration'
  | 'social'
  | 'special';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  iconUrl: string;
  requirement: string;
  progress: number; // 0-100
  unlockedAt: string | null;
}

// ─── Challenges ──────────────────────────────────────────────
export type ChallengeType = 'personal' | 'community' | 'head-to-head' | 'seasonal';

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  startDate: string;
  endDate: string;
  target: number;
  unit: string;
  currentProgress: number;
  participantCount: number;
  isActive: boolean;
}

// ─── API Types ───────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  requestId: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface ExerciseFilters extends PaginationParams {
  search?: string;
  muscleGroup?: MuscleGroup;
  equipment?: EquipmentType;
  difficulty?: Difficulty;
  tags?: string[];
}

export interface CardioFilters extends PaginationParams {
  search?: string;
  category?: CardioCategory;
  intensityLevel?: IntensityLevel;
  minFunRating?: number;
}

export interface RoutineRequest {
  goal: FitnessGoal;
  daysPerWeek: number;
  sessionDurationMin: number;
  fitnessLevel: FitnessLevel;
  availableEquipment: EquipmentType[];
  totalWeeks: number;
  injuries?: InjuryZone[];
  preferences?: RoutinePreferences;
}

export interface RoutinePreferences {
  muscleFocus?: MuscleGroup[];
  cardioTiming?: 'before' | 'after' | 'separate-day' | 'none';
  splitStyle?: 'push-pull-legs' | 'upper-lower' | 'full-body' | 'bro-split' | 'auto';
}

// ─── Auth Types ──────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
