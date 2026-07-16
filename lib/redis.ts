import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redis;
}

export const redisKeys = {
  banner: (orgId: string) => `banner:${orgId}`,
  reactionCount: (notificationId: string) => `reactions:${notificationId}:count`,
  reactionUsers: (notificationId: string) => `reactions:${notificationId}:users`,
};

export const BANNER_MAX_ITEMS = 50;
