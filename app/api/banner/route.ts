import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { getRedis, redisKeys } from "@/lib/redis";
import { checkRateLimit } from "@/lib/ratelimit";
import * as notificationRepo from "@/repositories/notifications";
import type { BannerItemDTO } from "@/lib/types";

export async function GET() {
  const { orgId, userId } = await requireOrg();

  const allowed = await checkRateLimit(`banner:${userId}`);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  let items: BannerItemDTO[] = [];

  try {
    items = await notificationRepo.getBannerFromRedis(orgId);
  } catch {
    items = [];
  }

  if (items.length === 0) {
    items = await notificationRepo.rebuildBannerCache(orgId);
  }

  const redis = getRedis();
  if (redis) {
    items = await Promise.all(
      items.map(async (item) => {
        const countKey = redisKeys.reactionCount(item.id);
        const usersKey = redisKeys.reactionUsers(item.id);

        const [count, reacted] = await Promise.all([
          redis.get<number>(countKey),
          redis.sismember(usersKey, userId),
        ]);

        return {
          ...item,
          likeCount: count ?? item.likeCount ?? 0,
          reacted: !!reacted,
        };
      })
    );
  }

  return NextResponse.json({ items });
}
