import { Redis } from "@upstash/redis";

import { getEnv } from "./env";

let cached: Redis | null | undefined;

/** Returns null when Upstash env is not configured (rate limit and analytics cache disabled). */
export function getRedis(): Redis | null {
  if (cached !== undefined) return cached;
  const env = getEnv();
  if (!env.UPSTASH_REDIS_REST_URL?.trim()) {
    cached = null;
    return null;
  }
  cached = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return cached;
}
