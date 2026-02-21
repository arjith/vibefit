import { Router } from 'express';

export const cardioRouter = Router();

// TODO: Wire to @vibefit/core database queries
cardioRouter.get('/', (_req, res) => {
  res.json({ success: true, data: [], meta: { total: 0, page: 1, pageSize: 24, totalPages: 0 } });
});

cardioRouter.get('/random', (_req, res) => {
  res.json({ success: true, data: null });
});

cardioRouter.get('/:id', (req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Cardio activity ${req.params.id} not found` } });
});
