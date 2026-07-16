import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { getRedis, redisKeys } from "@/lib/redis";
import { checkRateLimit } from "@/lib/ratelimit";
import * as notificationRepo from "@/repositories/notifications";
import { connectDB } from "@/lib/db";
import { User } from "@/models";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const { orgId, userId } = await requireOrg();

  const allowed = await checkRateLimit(`react:${userId}`);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const notification = await notificationRepo.getNotification(orgId, id);
  if (!notification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ count: notification.likeCount + 1, reacted: true });
  }

  const usersKey = redisKeys.reactionUsers(id);
  const countKey = redisKeys.reactionCount(id);

  const added = await redis.sadd(usersKey, userId);
  let count = notification.likeCount;

  if (added === 1) {
    count = await redis.incr(countKey);
    await notificationRepo.syncLikeCount(id, count);

    if (notification.pusherClerkId && notification.pusherClerkId !== userId) {
      await connectDB();
      const reactor = await User.findOne({ clerkUserId: userId }).lean();

      await notificationRepo.createNotification({
        organizationId: orgId,
        type: "reaction",
        title: `${reactor?.name ?? "Someone"} reacted 👍 to your push`,
        meta: {
          reactorClerkId: userId,
          reactorName: reactor?.name,
          originalNotificationId: id,
        },
        recipientClerkId: notification.pusherClerkId,
      });
    }
  } else {
    count = (await redis.get<number>(countKey)) ?? notification.likeCount;
  }

  return NextResponse.json({ count, reacted: true });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const { orgId, userId } = await requireOrg();

  const notification = await notificationRepo.getNotification(orgId, id);
  if (!notification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({
      count: Math.max(0, notification.likeCount - 1),
      reacted: false,
    });
  }

  const usersKey = redisKeys.reactionUsers(id);
  const countKey = redisKeys.reactionCount(id);

  const removed = await redis.srem(usersKey, userId);
  let count = notification.likeCount;

  if (removed === 1) {
    count = await redis.decr(countKey);
    if (count < 0) {
      count = 0;
      await redis.set(countKey, 0);
    }
    await notificationRepo.syncLikeCount(id, count);
  } else {
    count = (await redis.get<number>(countKey)) ?? notification.likeCount;
  }

  return NextResponse.json({ count, reacted: false });
}
