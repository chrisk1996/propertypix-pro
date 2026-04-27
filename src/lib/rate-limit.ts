/**
 * Rate limiting module.
 * Uses Redis (ioredis) when REDIS_URL is available, falls back to in-memory Map.
 * In-memory resets on deploy; Redis persists across deploys.
 */

import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis !== null) return redis;
  try {
    const url = process.env.REDIS_URL;
    if (url) {
      redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
      return redis;
    }
  } catch {
    // Redis not available
  }
  return null;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory fallback (resets on deploy)
const memoryMap = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  /** Max requests in the window */
  limit: number;
  /** Window duration in ms */
  windowMs: number;
}

/**
 * Check rate limit for a key (IP, user ID, etc.).
 * Returns { allowed: boolean, remaining: number }
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<{ allowed: boolean; remaining: number }> {
  const r = getRedis();

  if (r) {
    return redisRateLimit(r, key, options);
  }

  return memoryRateLimit(key, options);
}

async function redisRateLimit(
  redis: Redis,
  key: string,
  options: RateLimitOptions
): Promise<{ allowed: boolean; remaining: number }> {
  const redisKey = `ratelimit:${key}`;
  const now = Date.now();
  const windowStart = now - options.windowMs;

  // Use a Redis pipeline for atomicity
  const pipeline = redis.pipeline();

  // Remove old entries outside the window
  pipeline.zremrangebyscore(redisKey, '-inf', windowStart);
  // Add current request
  pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
  // Count entries in window
  pipeline.zcard(redisKey);
  // Set expiry on the key
  pipeline.expire(redisKey, Math.ceil(options.windowMs / 1000));

  const results = await pipeline.exec();
  const count = (results?.[2]?.[1] as number) ?? 0;

  if (count > options.limit) {
    // Remove the entry we just added since it's over limit
    await redis.zremrangebyscore(redisKey, now, now);
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: options.limit - count };
}

function memoryRateLimit(
  key: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = memoryMap.get(key);

  if (!entry || now > entry.resetTime) {
    memoryMap.set(key, { count: 1, resetTime: now + options.windowMs });
    return { allowed: true, remaining: options.limit - 1 };
  }

  if (entry.count >= options.limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: options.limit - entry.count };
}
