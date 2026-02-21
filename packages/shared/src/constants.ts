// ─── Entity State Machine Constants ─────────────────────────
export const STALE_AFTER_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_RETRY_COUNT = 3;
export const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;
export const TOAST_AUTO_DISMISS_MS = 5000;
export const SEARCH_DEBOUNCE_MS = 300;

// ─── Pagination ──────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;

// ─── Workout ─────────────────────────────────────────────────
export const MIN_TOUCH_TARGET_PX = 44;
export const WORKOUT_TOUCH_TARGET_PX = 56;
export const DEFAULT_REST_SECONDS = 90;

// ─── Streak ──────────────────────────────────────────────────
export const STREAK_MILESTONES = [
  { days: 7, type: 'bronze' as const },
  { days: 30, type: 'silver' as const },
  { days: 100, type: 'gold' as const },
  { days: 365, type: 'diamond' as const },
] as const;

export const FREE_FREEZES_PER_WEEK = 1;
export const PRO_FREEZES_PER_WEEK = 3;

// ─── Routine ─────────────────────────────────────────────────
export const ROUTINE_WEEK_OPTIONS = [4, 8, 12] as const;
export const MIN_DAYS_PER_WEEK = 2;
export const MAX_DAYS_PER_WEEK = 6;
export const MIN_SESSION_DURATION_MIN = 15;
export const MAX_SESSION_DURATION_MIN = 120;

// ─── Progressive Overload ────────────────────────────────────
export const OVERLOAD_CONFIG = {
  beginner: {
    upperBodyWeightIncreaseLb: 2.5,
    lowerBodyWeightIncreaseLb: 5,
    strategy: 'linear' as const,
  },
  intermediate: {
    upperBodyWeightIncreaseLb: 2.5,
    lowerBodyWeightIncreaseLb: 2.5,
    strategy: 'undulating' as const,
  },
  advanced: {
    upperBodyWeightIncreaseLb: 1.25,
    lowerBodyWeightIncreaseLb: 2.5,
    strategy: 'wave-loading' as const,
  },
} as const;

// ─── Fitness Goals (extending GymVerse) ──────────────────────
export const FITNESS_GOALS = [
  {
    id: 'muscle-building',
    label: 'Build Muscle',
    emoji: '💪',
    description: 'Increase muscle mass with hypertrophy-focused training',
  },
  {
    id: 'strength',
    label: 'Get Stronger',
    emoji: '🏋️',
    description: 'Maximize strength with progressive overload',
  },
  {
    id: 'weight-loss',
    label: 'Lose Weight',
    emoji: '🔥',
    description: 'Burn fat with high-intensity circuits and cardio',
  },
  {
    id: 'endurance',
    label: 'Build Endurance',
    emoji: '🏃',
    description: 'Improve stamina and cardiovascular fitness',
  },
  {
    id: 'flexibility',
    label: 'Improve Flexibility',
    emoji: '🧘',
    description: 'Increase mobility and range of motion',
  },
  {
    id: 'athletic-performance',
    label: 'Athletic Performance',
    emoji: '⚡',
    description: 'Train for power, agility, and sport-specific fitness',
  },
  {
    id: 'general-fitness',
    label: 'General Fitness',
    emoji: '❤️',
    description: 'Balanced approach to overall health and wellness',
  },
] as const;

// ─── Equipment Options ───────────────────────────────────────
export const EQUIPMENT_OPTIONS = [
  { id: 'barbell', label: 'Barbell', emoji: '🏋️' },
  { id: 'dumbbell', label: 'Dumbbells', emoji: '💪' },
  { id: 'cable', label: 'Cable Machine', emoji: '🔗' },
  { id: 'machine', label: 'Machines', emoji: '⚙️' },
  { id: 'bodyweight', label: 'Bodyweight', emoji: '🤸' },
  { id: 'kettlebell', label: 'Kettlebell', emoji: '🔔' },
  { id: 'resistance-band', label: 'Resistance Bands', emoji: '🎗️' },
  { id: 'none', label: 'No Equipment', emoji: '✋' },
] as const;

export const EQUIPMENT_PRESETS = {
  gym: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell'],
  home: ['dumbbell', 'bodyweight', 'resistance-band', 'kettlebell'],
  travel: ['bodyweight', 'resistance-band'],
} as const;

// ─── Muscle Groups ───────────────────────────────────────────
export const MUSCLE_GROUPS = [
  { id: 'chest', label: 'Chest', color: '#ff6b6b' },
  { id: 'back', label: 'Back', color: '#4ecdc4' },
  { id: 'shoulders', label: 'Shoulders', color: '#45b7d1' },
  { id: 'legs', label: 'Legs', color: '#96ceb4' },
  { id: 'arms', label: 'Arms', color: '#ffeaa7' },
  { id: 'core', label: 'Core', color: '#dfe6e9' },
  { id: 'glutes', label: 'Glutes', color: '#fd79a8' },
  { id: 'full-body', label: 'Full Body', color: '#9EFD38' },
] as const;
