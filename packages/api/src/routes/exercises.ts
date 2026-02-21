import { Router } from 'express';

export const exerciseRouter = Router();

// TODO: Wire to @vibefit/core database queries
exerciseRouter.get('/', (_req, res) => {
  res.json({ success: true, data: [], meta: { total: 0, page: 1, pageSize: 24, totalPages: 0 } });
});

exerciseRouter.get('/:id', (req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Exercise ${req.params.id} not found` } });
});
