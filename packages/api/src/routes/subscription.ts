import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const subscriptionRouter = Router();
subscriptionRouter.use(authenticate);

// ─── GET /subscription ──────────────────────────────────────
// Get current user's subscription status
subscriptionRouter.get('/', async (_req, res, next) => {
  try {
    // For now, subscription data is derived from user metadata
    // In production, this queries a subscriptions table / Stripe API
    const subscription = {
      tier: 'free' as const,
      features: FREE_FEATURES,
      limits: FREE_LIMITS,
      trialDaysRemaining: null as number | null,
    };

    res.json({ success: true, data: subscription });
  } catch (err) {
    next(err);
  }
});

// ─── GET /subscription/plans ────────────────────────────────
subscriptionRouter.get('/plans', async (_req, res) => {
  res.json({
    success: true,
    data: PLANS,
  });
});

// ─── POST /subscription/checkout ────────────────────────────
// Create a Stripe checkout session (placeholder — requires Stripe secret key)
const checkoutSchema = z.object({
  planId: z.enum(['pro', 'coach']),
});

subscriptionRouter.post('/checkout', async (req, res, next) => {
  try {
    const { planId } = checkoutSchema.parse(req.body);
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) throw new AppError(400, 'INVALID_PLAN', 'Plan not found');

    // In production: create Stripe checkout session
    // const session = await stripe.checkout.sessions.create({...})
    // For now, return a stub
    res.json({
      success: true,
      data: {
        planId,
        message: 'Stripe integration pending — set STRIPE_SECRET_KEY to enable.',
        checkoutUrl: null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Feature definitions ─────────────────────────────────────

const FREE_FEATURES = [
  'exercise-library',
  'basic-tracking',
  'streaks',
  'achievements',
  'basic-analytics',
] as const;

const PRO_FEATURES = [
  ...FREE_FEATURES,
  'unlimited-routines',
  'ai-coach',
  'advanced-analytics',
  'adherence-prediction',
  'adaptive-difficulty',
  'extra-freezes',
  'form-cues',
  'biomech-substitution',
] as const;

const COACH_FEATURES = [
  ...PRO_FEATURES,
  'create-programs',
  'client-management',
  'revenue-share',
] as const;

const FREE_LIMITS = {
  maxRoutines: 3,
  freezesPerWeek: 1,
  aiCoachMessages: 0,
} as const;

const PRO_LIMITS = {
  maxRoutines: -1, // unlimited
  freezesPerWeek: 3,
  aiCoachMessages: -1,
} as const;

const COACH_LIMITS = {
  maxRoutines: -1,
  freezesPerWeek: 3,
  aiCoachMessages: -1,
} as const;

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    features: [...FREE_FEATURES],
    limits: FREE_LIMITS,
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    interval: 'month' as const,
    features: [...PRO_FEATURES],
    limits: PRO_LIMITS,
    highlight: true,
    trialDays: 7,
  },
  {
    id: 'coach',
    name: 'Coach',
    price: 29.99,
    interval: 'month' as const,
    features: [...COACH_FEATURES],
    limits: COACH_LIMITS,
    highlight: false,
  },
] as const;

export { PLANS, FREE_FEATURES, PRO_FEATURES, FREE_LIMITS, PRO_LIMITS };
