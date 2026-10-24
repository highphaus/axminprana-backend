import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitStore>();

// Clean expired records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const key = `${Array.isArray(ip) ? ip[0] : ip}:${req.baseUrl || req.path}`;
    const now = Date.now();

    const record = memoryStore.get(key);

    if (!record || now > record.resetTime) {
      memoryStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      const retrySecs = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retrySecs);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: retrySecs
      });
    }

    record.count += 1;
    next();
  };
};

// Specialized limiters for critical endpoints
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 min window
  message: 'Too many authentication attempts from this IP. Please wait 15 minutes before trying again.'
});

export const otpLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 OTP dispatches per 10 min window
  message: 'Too many OTP requests. Please wait a few minutes before requesting another verification code.'
});

export const enquiryLimiter = createRateLimiter({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 10,
  message: 'Bulk enquiry submission limit reached for this session. Please call our direct helpline for urgent requests.'
});
