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
  pollLock: (repoFullName: string) => `poll:gh:lock:${repoFullName}`,
  pollEtag: (repoFullName: string) => `poll:gh:etag:${repoFullName}`,
  presence: (orgId: string) => `presence:${orgId}`,
};

export const BANNER_MAX_ITEMS = 50;
export const BANNER_TTL_MS = 5 * 60 * 1000;
export const REPO_POLL_THROTTLE_MS = 60_000;
export const POLL_LOOKBACK_MS = BANNER_TTL_MS;
export const PRESENCE_HEARTBEAT_MS = 30_000;
export const PRESENCE_TTL_MS = 90_000;
