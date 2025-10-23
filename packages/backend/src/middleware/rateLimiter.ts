import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import { config } from '../config';

// Redis client for rate limiting
let redisClient: any = null;

const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
      database: config.redis.db,
    });

    redisClient.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
  }
  return redisClient;
};

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs = config.security.rateLimitWindowMs,
    max = config.security.rateLimitMax,
    keyGenerator = (req: Request) => req.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const redis = await getRedisClient();
      const key = `rate_limit:${keyGenerator(req)}`;
      const now = Date.now();
      const window = Math.floor(now / windowMs);
      const windowKey = `${key}:${window}`;

      // Get current count
      const current = await redis.get(windowKey);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= max) {
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil(windowMs / 1000),
        });
        return;
      }

      // Increment counter
      await redis.multi()
        .incr(windowKey)
        .expire(windowKey, Math.ceil(windowMs / 1000))
        .exec();

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': Math.max(0, max - count - 1).toString(),
        'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
      });

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // If Redis is down, allow the request to proceed
      next();
    }
  };
};

// Predefined rate limiters
export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  keyGenerator: (req: Request) => `auth:${req.ip}`,
});

export const aiRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute
  keyGenerator: (req: Request) => `ai:${req.ip}`,
});

export const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 uploads per minute
  keyGenerator: (req: Request) => `upload:${req.ip}`,
});