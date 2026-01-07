/**
 * Simple in-memory rate limiter for API routes
 * For production with multiple instances, use Redis instead
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitMap.entries()).forEach(([key, entry]) => {
    if (entry.resetTime < now) {
      rateLimitMap.delete(key);
    }
  });
}, 5 * 60 * 1000);

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

/**
 * Check if request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Result with success status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const key = identifier;

  const entry = rateLimitMap.get(key);

  // No existing entry or window expired
  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(key, {
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
};
