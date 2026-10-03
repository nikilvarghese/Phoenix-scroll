import { Request, Response, NextFunction } from 'express';

// Middleware to set CDN & browser cache control headers for public endpoints
export const cacheControl = (durationSeconds: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${durationSeconds}, s-maxage=${durationSeconds * 2}, stale-while-revalidate=60`);
    } else {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
    next();
  };
};

// Middleware to disable caching for sensitive authenticated routes
export const noCache = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};
