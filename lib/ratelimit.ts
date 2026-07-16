import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

export function getRateLimiter() {
  const redis = getRedis();
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: false,
    prefix: "pm-ratelimit",
  });
}

export async function checkRateLimit(identifier: string): Promise<boolean> {
  const limiter = getRateLimiter();
  if (!limiter) return true;

  const { success } = await limiter.limit(identifier);
  return success;
}
