// @vibefit/ml — Machine Learning models (LSTM adherence prediction, etc.)
export const ML_VERSION = '0.1.0';

export {
  buildModel,
  trainModel,
  predictAdherence,
  heuristicAdherencePrediction,
  type AdherenceDataPoint,
  type AdherencePrediction,
  SEQUENCE_LENGTH,
  FEATURE_COUNT,
} from './adherenceModel.js';
