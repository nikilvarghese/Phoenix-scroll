import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();
const startTime = Date.now();

router.get('/', async (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const isHealthy = dbState === 1;
  const memoryUsage = process.memoryUsage();

  const healthData = {
    status: isHealthy ? 'UP' : 'DOWN',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      readyState: dbState,
    },
    system: {
      memoryRssMB: Math.round(memoryUsage.rss / (1024 * 1024)),
      heapTotalMB: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
      heapUsedMB: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
    },
  };

  res.status(isHealthy ? 200 : 503).json(healthData);
});

export default router;
