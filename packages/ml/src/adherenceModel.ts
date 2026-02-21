import * as tf from '@tensorflow/tfjs';

/**
 * LSTM-based adherence prediction model.
 * Predicts the probability (0-1) that a user will complete their next workout
 * based on a sequence of recent activity features.
 *
 * Input features per timestep (7):
 *   0: didWorkout (0/1)
 *   1: dayOfWeek (0-6, normalized to 0-1)
 *   2: rpe (1-10, normalized to 0-1)
 *   3: mood (1-5, normalized to 0-1)
 *   4: currentStreak (capped at 30, normalized)
 *   5: daysSinceLastWorkout (capped at 14, normalized)
 *   6: sessionDurationMin (capped at 120, normalized)
 */

const SEQUENCE_LENGTH = 14; // Two weeks of daily data
const FEATURE_COUNT = 7;
const EPOCHS = 50;
const BATCH_SIZE = 8;

export interface AdherenceDataPoint {
  didWorkout: boolean;
  dayOfWeek: number;
  rpe: number | null;
  mood: number | null;
  currentStreak: number;
  daysSinceLastWorkout: number;
  sessionDurationMin: number;
}

export interface AdherencePrediction {
  probability: number;       // 0-1: likelihood of completing next workout
  riskLevel: 'low' | 'medium' | 'high';
  suggestion: string;
}

function normalizeFeatures(point: AdherenceDataPoint): number[] {
  return [
    point.didWorkout ? 1 : 0,
    point.dayOfWeek / 6,
    (point.rpe ?? 5) / 10,
    (point.mood ?? 3) / 5,
    Math.min(point.currentStreak, 30) / 30,
    Math.min(point.daysSinceLastWorkout, 14) / 14,
    Math.min(point.sessionDurationMin, 120) / 120,
  ];
}

export function buildModel(): tf.LayersModel {
  const model = tf.sequential();

  model.add(tf.layers.lstm({
    units: 32,
    inputShape: [SEQUENCE_LENGTH, FEATURE_COUNT],
    returnSequences: false,
  }));

  model.add(tf.layers.dropout({ rate: 0.2 }));

  model.add(tf.layers.dense({ units: 16, activation: 'relu' }));

  model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  return model;
}

/**
 * Train the model on historical user data.
 * Returns training accuracy.
 */
export async function trainModel(
  model: tf.LayersModel,
  sequences: AdherenceDataPoint[][],
  labels: boolean[],
): Promise<number> {
  if (sequences.length < 5) {
    return 0; // Not enough data
  }

  const xData = sequences.map((seq) => {
    // Pad or truncate sequence to SEQUENCE_LENGTH
    const padded = [...seq];
    while (padded.length < SEQUENCE_LENGTH) {
      padded.unshift({ didWorkout: false, dayOfWeek: 0, rpe: null, mood: null, currentStreak: 0, daysSinceLastWorkout: 14, sessionDurationMin: 0 });
    }
    return padded.slice(-SEQUENCE_LENGTH).map(normalizeFeatures);
  });

  const yData = labels.map((l) => (l ? 1 : 0));

  const xs = tf.tensor3d(xData);
  const ys = tf.tensor2d(yData, [yData.length, 1]);

  try {
    const history = await model.fit(xs, ys, {
      epochs: EPOCHS,
      batchSize: BATCH_SIZE,
      validationSplit: 0.2,
      shuffle: true,
      verbose: 0,
    });

    const acc = history.history['accuracy'];
    return Array.isArray(acc) ? (acc[acc.length - 1] as number) : 0;
  } finally {
    xs.dispose();
    ys.dispose();
  }
}

/**
 * Predict adherence for the next workout given a sequence of recent data.
 */
export async function predictAdherence(
  model: tf.LayersModel,
  recentHistory: AdherenceDataPoint[],
): Promise<AdherencePrediction> {
  const padded = [...recentHistory];
  while (padded.length < SEQUENCE_LENGTH) {
    padded.unshift({ didWorkout: false, dayOfWeek: 0, rpe: null, mood: null, currentStreak: 0, daysSinceLastWorkout: 14, sessionDurationMin: 0 });
  }

  const input = padded.slice(-SEQUENCE_LENGTH).map(normalizeFeatures);
  const xs = tf.tensor3d([input]);

  try {
    const prediction = model.predict(xs) as tf.Tensor;
    const probability = (await prediction.data())[0];
    prediction.dispose();

    const riskLevel: AdherencePrediction['riskLevel'] =
      probability >= 0.7 ? 'low' :
      probability >= 0.4 ? 'medium' : 'high';

    const suggestions: Record<AdherencePrediction['riskLevel'], string> = {
      low: 'You\'re on track! Keep the momentum going.',
      medium: 'Your adherence may dip — consider a lighter session or a fun workout to stay engaged.',
      high: 'Risk of skipping detected. Try a 15-minute mini session or invite a friend to keep the streak alive.',
    };

    return { probability, riskLevel, suggestion: suggestions[riskLevel] };
  } finally {
    xs.dispose();
  }
}

/**
 * Heuristic fallback when not enough data for LSTM.
 * Uses simple rules based on streak, recency, and RPE.
 */
export function heuristicAdherencePrediction(
  currentStreak: number,
  daysSinceLastWorkout: number,
  recentAvgRpe: number | null,
): AdherencePrediction {
  let score = 0.5;

  // Streak bonus
  if (currentStreak >= 7) score += 0.15;
  else if (currentStreak >= 3) score += 0.1;
  else if (currentStreak === 0) score -= 0.1;

  // Recency
  if (daysSinceLastWorkout <= 1) score += 0.1;
  else if (daysSinceLastWorkout >= 4) score -= 0.15;
  else if (daysSinceLastWorkout >= 7) score -= 0.25;

  // RPE fatigue
  if (recentAvgRpe !== null) {
    if (recentAvgRpe >= 9) score -= 0.1; // Overtraining risk
    else if (recentAvgRpe <= 6) score += 0.05; // Comfortable
  }

  const probability = Math.max(0, Math.min(1, score));
  const riskLevel: AdherencePrediction['riskLevel'] =
    probability >= 0.7 ? 'low' :
    probability >= 0.4 ? 'medium' : 'high';

  const suggestions: Record<AdherencePrediction['riskLevel'], string> = {
    low: 'You\'re on track! Keep the momentum going.',
    medium: 'Your adherence may dip — consider a lighter session or a fun workout to stay engaged.',
    high: 'Risk of skipping detected. Try a 15-minute mini session or invite a friend to keep the streak alive.',
  };

  return { probability, riskLevel, suggestion: suggestions[riskLevel] };
}

export { SEQUENCE_LENGTH, FEATURE_COUNT };
