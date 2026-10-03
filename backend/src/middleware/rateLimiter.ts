import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwt.js';

const AUTHOR_EMAIL = 'nikiledwin6@gmail.com';

const isAuthorRequest = (req: any): boolean => {
  // Check request body email for login/OTP
  if (req.body?.email && req.body.email.toLowerCase().trim() === AUTHOR_EMAIL) {
    return true;
  }

  // Check Bearer JWT token for API calls
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret()) as any;
      if (decoded && (decoded.role === 'owner' || decoded.email === AUTHOR_EMAIL)) {
        return true;
      }
    } catch {
      // Ignore token decode error
    }
  }

  return false;
};

// Rate limit for authentication & OTP endpoints (bypassed for author)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isAuthorRequest,
  message: {
    status: 429,
    message: 'Too many authentication attempts. Please try again after 15 minutes for security reasons.',
  },
});

// General rate limit for standard API endpoints (bypassed for author)
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isAuthorRequest,
  message: {
    status: 429,
    message: 'Rate limit exceeded. Please slow down your API requests.',
  },
});
