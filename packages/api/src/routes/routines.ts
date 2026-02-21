import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

export const routineRouter = Router();

// TODO: Wire to @vibefit/core routine generator
routineRouter.post('/preview', (_req, res) => {
  res.json({ success: true, data: null });
});

routineRouter.post('/generate', authenticate, (_req, res) => {
  res.json({ success: true, data: null });
});

routineRouter.get('/', authenticate, (_req, res) => {
  res.json({ success: true, data: [] });
});

routineRouter.get('/:id', authenticate, (req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Routine ${req.params.id} not found` } });
});

routineRouter.delete('/:id', authenticate, (req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Routine ${req.params.id} not found` } });
});
