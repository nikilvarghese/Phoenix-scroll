import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error stack trace
  console.error(`❌ [ERROR] ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    ip: req.ip,
  });

  res.status(statusCode).json({
    status: statusCode,
    message: err.message || 'An unexpected server error occurred.',
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
