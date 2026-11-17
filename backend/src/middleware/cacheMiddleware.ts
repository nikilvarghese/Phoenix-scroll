import { Request, Response, NextFunction } from 'express';

// Middleware to set CDN & browser cache control headers for public endpoints
export const cacheControl = (durationSeconds: number = 60) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Authenticated users should always get fresh uncached responses
    if (req.headers.authorization) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      return next();
    }
    // Only cache unauthenticated GET requests
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${durationSeconds}, s-maxage=${durationSeconds}, stale-while-revalidate=30`);
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
