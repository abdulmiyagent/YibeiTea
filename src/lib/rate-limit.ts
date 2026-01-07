/**
 * Rate limiter with Upstash Redis support
 * Falls back to in-memory for local development without Upstash credentials
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash credentials are available
const hasUpstashCredentials =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Create Redis client only if credentials exist
const redis = hasUpstashCredentials
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// In-memory fallback for local development
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

// Create Upstash rate limiters for different use cases
const upstashLimiters = redis
  ? {
      login: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "ratelimit:login",
      }),
      register: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        prefix: "ratelimit:register",
      }),
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        prefix: "ratelimit:api",
      }),
      guestOrder: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        prefix: "ratelimit:guest-order",
      }),
    }
  : null;

/**
 * Check rate limit using Upstash Redis (production) or in-memory (development)
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Use Upstash if available
  if (redis && upstashLimiters) {
    // Determine which limiter to use based on config
    let limiter: Ratelimit;
    if (config.windowSeconds === 15 * 60 && config.limit === 5) {
      limiter = upstashLimiters.login;
    } else if (config.windowSeconds === 60 * 60 && config.limit === 5) {
      limiter = upstashLimiters.register;
    } else if (config.windowSeconds === 60 && config.limit === 100) {
      limiter = upstashLimiters.api;
    } else {
      // Create a custom limiter for non-standard configs
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
        prefix: `ratelimit:custom:${config.limit}:${config.windowSeconds}`,
      });
    }

    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      remaining: result.remaining,
      resetIn: Math.ceil((result.reset - Date.now()) / 1000),
    };
  }

  // Fallback to in-memory for local development
  return checkInMemoryRateLimit(identifier, config);
}

/**
 * In-memory rate limiter fallback
 */
function checkInMemoryRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = identifier;

  const entry = inMemoryStore.get(key);

  // No existing entry or window expired
  if (!entry || entry.resetTime < now) {
    inMemoryStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      remaining: config.limit - 1,
      resetIn: config.windowSeconds,
    };
  }

  // Within window, check count
  if (entry.count >= config.limit) {
    const resetIn = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetIn,
    };
  }

  // Increment count
  entry.count += 1;
  const resetIn = Math.ceil((entry.resetTime - now) / 1000);

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetIn,
  };
}

/**
 * Get client IP from request headers
 * Works with Vercel, Cloudflare, and standard proxies
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Vercel
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Standard
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  return "unknown";
}

// Pre-configured rate limiters
export const rateLimiters = {
  /** Login: 5 attempts per 15 minutes */
  login: { limit: 5, windowSeconds: 15 * 60 },
  /** Register: 5 accounts per hour per IP */
  register: { limit: 5, windowSeconds: 60 * 60 },
  /** General API: 100 requests per minute */
  api: { limit: 100, windowSeconds: 60 },
  /** Guest orders: 5 orders per hour per email */
  guestOrder: { limit: 5, windowSeconds: 60 * 60 },
};

/**
 * Check if running with Upstash (for logging/debugging)
 */
export function isUsingUpstash(): boolean {
  return Boolean(hasUpstashCredentials) && redis !== null;
}
