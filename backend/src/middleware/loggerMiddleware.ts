import { Request, Response, NextFunction } from 'express';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;
  const userAgent = req.headers['user-agent'] || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    const statusCategory = statusCode >= 500 ? '🔴' : statusCode >= 400 ? '🟡' : '🟢';

    const logEntry = {
      timestamp: new Date().toISOString(),
      method,
      url: originalUrl,
      status: statusCode,
      durationMs: duration,
      ip: (req.headers['x-forwarded-for'] as string) || ip || '127.0.0.1',
      userAgent,
    };

    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`${statusCategory} [${logEntry.timestamp}] ${method} ${originalUrl} ${statusCode} - ${duration}ms (${logEntry.ip})`);
    }
  });

  next();
};
