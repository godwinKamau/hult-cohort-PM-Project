import { connectDB } from "@/lib/db";
import {
  BANNER_MAX_ITEMS,
  BANNER_TTL_MS,
  getRedis,
  redisKeys,
} from "@/lib/redis";
import { serializeDoc } from "@/lib/serialize";
import type { BannerItemDTO, NotificationDTO } from "@/lib/types";
import { Notification } from "@/models";

export async function createNotification(
  data: Omit<NotificationDTO, "id" | "likeCount" | "createdAt"> & {
    deliveryId?: string;
  }
): Promise<NotificationDTO | null> {
  await connectDB();
  try {
    const doc = await Notification.create({
      organizationId: data.organizationId,
      projectId: data.projectId,
      type: data.type,
      title: data.title,
      meta: data.meta,
      pusherClerkId: data.pusherClerkId,
      recipientClerkId: data.recipientClerkId,
      deliveryId: data.deliveryId,
      likeCount: 0,
    });
    return serializeDoc<NotificationDTO>(doc.toObject())!;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === 11000
    ) {
      return null;
    }
    throw err;
  }
}

export async function listRecentNotifications(
  orgId: string,
  limit = BANNER_MAX_ITEMS
): Promise<NotificationDTO[]> {
  await connectDB();
  const docs = await Notification.find({
    organizationId: orgId,
    type: { $in: ["push", "pull_request"] },
    createdAt: { $gte: new Date(Date.now() - BANNER_TTL_MS) },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map((d) => serializeDoc<NotificationDTO>(d)!);
}

export async function getPersonalNotifications(
  recipientClerkId: string,
  limit = 20
): Promise<NotificationDTO[]> {
  await connectDB();
  const docs = await Notification.find({
    recipientClerkId,
    type: "reaction",
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return docs.map((d) => serializeDoc<NotificationDTO>(d)!);
}

export async function getNotification(
  orgId: string,
  notificationId: string
): Promise<NotificationDTO | null> {
  await connectDB();
  const doc = await Notification.findOne({
    _id: notificationId,
    organizationId: orgId,
  }).lean();
  return serializeDoc<NotificationDTO>(doc);
}

export async function enqueueBannerItem(
  orgId: string,
  item: BannerItemDTO
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const key = redisKeys.banner(orgId);
  await redis.lpush(key, JSON.stringify(item));
  await redis.ltrim(key, 0, BANNER_MAX_ITEMS - 1);
}

export async function getBannerFromRedis(
  orgId: string
): Promise<BannerItemDTO[]> {
  const redis = getRedis();
  if (!redis) return [];

  const key = redisKeys.banner(orgId);
  const items = await redis.lrange<string>(key, 0, BANNER_MAX_ITEMS - 1);
  return items
    .map((item) => {
      try {
        return typeof item === "string" ? JSON.parse(item) : item;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as BannerItemDTO[];
}

export async function syncBannerCache(
  orgId: string,
  notifications: NotificationDTO[]
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const key = redisKeys.banner(orgId);
  await redis.del(key);
  for (const n of [...notifications].reverse()) {
    await redis.lpush(key, JSON.stringify({ ...n, reacted: false }));
  }
  await redis.ltrim(key, 0, BANNER_MAX_ITEMS - 1);
}

export async function rebuildBannerCache(orgId: string): Promise<BannerItemDTO[]> {
  const notifications = await listRecentNotifications(orgId);
  await syncBannerCache(orgId, notifications);
  return notifications.map((n) => ({ ...n, reacted: false }));
}

export async function syncLikeCount(
  notificationId: string,
  count: number
): Promise<void> {
  await connectDB();
  await Notification.findByIdAndUpdate(notificationId, { likeCount: count });
}

export async function findUserByGithubUsername(
  githubUsername: string
): Promise<string | null> {
  await connectDB();
  const { User } = await import("@/models");
  const user = await User.findOne({
    githubUsername: { $regex: new RegExp(`^${githubUsername}$`, "i") },
  }).lean();
  return user?.clerkUserId ?? null;
}
