import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { pinoLogger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { exerciseRouter } from './routes/exercises.js';
import { cardioRouter } from './routes/cardio.js';
import { routineRouter } from './routes/routines.js';
import { profileRouter } from './routes/profile.js';
import { workoutRouter } from './routes/workouts.js';
import { streakRouter } from './routes/streaks.js';
import { achievementRouter } from './routes/achievements.js';
import { analyticsRouter } from './routes/analytics.js';
import { recapRouter } from './routes/recaps.js';
import { coachRouter } from './routes/coach.js';
import { subscriptionRouter } from './routes/subscription.js';
import { socialRouter } from './routes/social.js';
import { challengeRouter } from './routes/challenges.js';
import { marketplaceRouter } from './routes/marketplace.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '8001', 10);

// ─── Security ────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ─── Middleware ──────────────────────────────────────────────
app.use(requestId);

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/exercises', exerciseRouter);
app.use('/api/cardio', cardioRouter);
app.use('/api/routines', routineRouter);
app.use('/api/profile', profileRouter);
app.use('/api/workouts', workoutRouter);
app.use('/api/streaks', streakRouter);
app.use('/api/achievements', achievementRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/recaps', recapRouter);
app.use('/api/coach', coachRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/social', socialRouter);
app.use('/api/challenges', challengeRouter);
app.use('/api/marketplace', marketplaceRouter);

// ─── Error Handler (must be last) ───────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  pinoLogger.info(`VibeFit API running on port ${PORT}`);
});

export { app };
