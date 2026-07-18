import {
  getRedis,
  PRESENCE_TTL_MS,
  redisKeys,
} from "@/lib/redis";

function presenceMember(userId: string, tabId: string): string {
  return `${userId}:${tabId}`;
}

function extractUserId(member: string): string | null {
  const colonIndex = member.indexOf(":");
  if (colonIndex <= 0) return null;
  return member.slice(0, colonIndex);
}

export async function recordPresence(
  orgId: string,
  userId: string,
  tabId: string
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  const key = redisKeys.presence(orgId);
  const now = Date.now();
  const cutoff = now - PRESENCE_TTL_MS;

  await redis.zremrangebyscore(key, 0, cutoff);
  await redis.zadd(key, { score: now, member: presenceMember(userId, tabId) });
  await redis.expire(key, Math.ceil(PRESENCE_TTL_MS / 1000));

  return true;
}

export async function listOnlineUserIds(orgId: string): Promise<{
  available: boolean;
  userIds: string[];
}> {
  const redis = getRedis();
  if (!redis) {
    return { available: false, userIds: [] };
  }

  const key = redisKeys.presence(orgId);
  const cutoff = Date.now() - PRESENCE_TTL_MS;

  await redis.zremrangebyscore(key, 0, cutoff);
  const members = await redis.zrange<string[]>(key, 0, -1);

  const userIds = new Set<string>();
  for (const member of members ?? []) {
    const userId = extractUserId(member);
    if (userId) {
      userIds.add(userId);
    }
  }

  return { available: true, userIds: [...userIds] };
}
