import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { askCoach } from '../services/aiCoach.js';

export const coachRouter = Router();
coachRouter.use(authenticate);

const askSchema = z.object({
  question: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'coach']),
    content: z.string(),
    timestamp: z.string(),
  })).optional().default([]),
});

// ─── POST /coach/ask ────────────────────────────────────────
coachRouter.post('/ask', async (req, res, next) => {
  try {
    const body = askSchema.parse(req.body);
    const history = body.history.map((m) => ({
      role: m.role as 'user' | 'coach',
      content: m.content,
      timestamp: new Date(m.timestamp),
    }));

    const response = await askCoach(req.userId!, body.question, history);

    res.json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
});
