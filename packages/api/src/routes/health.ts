import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      version: '0.1.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});
