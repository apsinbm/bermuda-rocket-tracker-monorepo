/**
 * Rate Limiting Utility for Vercel Serverless Functions
 *
 * Provides IP-based rate limiting using Upstash Redis
 * Gracefully degrades if Redis not configured
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Redis connection (lazy-loaded)
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

function initializeRateLimit() {
  if (ratelimit !== null) {
    return ratelimit;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[Security] Rate limiting disabled - UPSTASH_REDIS credentials not configured');
    }
    return null;
  }

  redis = new Redis({ url, token });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
    analytics: true,
    prefix: 'ratelimit:api',
  });

  return ratelimit;
}

/**
 * Extract client IP from Vercel request with fallback chain
 */
function getClientIp(req: VercelRequest): string {
  // Vercel automatically sets x-forwarded-for with client IP
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp;
  }

  return 'anonymous';
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for the current request
 * Returns null if rate limiting is not configured (allows request)
 */
export async function checkRateLimit(req: VercelRequest): Promise<RateLimitResult | null> {
  const limiter = initializeRateLimit();

  if (!limiter) {
    // Rate limiting not configured - allow request
    return null;
  }

  const ip = getClientIp(req);
  const { success, limit, remaining, reset } = await limiter.limit(ip);

  return {
    allowed: success,
    limit,
    remaining,
    reset,
  };
}

/**
 * Apply rate limiting to a serverless function
 * Automatically adds rate limit headers and returns 429 if exceeded
 */
export async function withRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  handler: () => Promise<VercelResponse | void>
): Promise<VercelResponse | void> {
  const result = await checkRateLimit(req);

  // If rate limiting not configured, proceed without headers
  if (result === null) {
    return handler();
  }

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', result.limit.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', result.reset.toString());

  // If rate limit exceeded, return 429
  if (!result.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: new Date(result.reset).toISOString(),
    });
  }

  // Rate limit OK - proceed with handler
  return handler();
}
