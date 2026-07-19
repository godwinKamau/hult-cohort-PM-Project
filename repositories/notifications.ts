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

type NotificationInput = Omit<NotificationDTO, "id" | "likeCount" | "createdAt"> & {
  deliveryId?: string;
};

const PR_ACTION_PRIORITY: Record<string, number> = {
  opened: 1,
  ready_for_review: 2,
  reopened: 3,
  closed: 4,
  merged: 5,
};

function prActionPriority(action?: string | null): number {
  if (!action) return 0;
  return PR_ACTION_PRIORITY[action] ?? 0;
}

function pullRequestKey(repo?: string, prNumber?: number): string | null {
  if (!repo || prNumber == null) return null;
  return `${repo.toLowerCase()}#${prNumber}`;
}

/** Keep one banner item per PR, preferring merged/closed over opened. */
export function collapseNotificationsForBanner(
  notifications: NotificationDTO[]
): NotificationDTO[] {
  const bestByPr = new Map<string, NotificationDTO>();
  const result: NotificationDTO[] = [];

  for (const notification of notifications) {
    if (notification.type !== "pull_request") {
      result.push(notification);
      continue;
    }

    const key = pullRequestKey(
      notification.meta.repo,
      notification.meta.prNumber
    );
    if (!key) {
      result.push(notification);
      continue;
    }

    const existing = bestByPr.get(key);
    if (!existing) {
      bestByPr.set(key, notification);
      continue;
    }

    const existingPriority = prActionPriority(existing.meta.prAction);
    const nextPriority = prActionPriority(notification.meta.prAction);

    if (
      nextPriority > existingPriority ||
      (nextPriority === existingPriority &&
        notification.createdAt > existing.createdAt)
    ) {
      bestByPr.set(key, notification);
    }
  }

  const collapsedPrs = [...bestByPr.values()];
  const pushes = result;
  return [...pushes, ...collapsedPrs].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export async function createNotification(
  data: NotificationInput
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

/**
 * Create a PR banner notification, skipping if a higher-priority action
 * already exists, and removing lower-priority ones (e.g. opened → merged).
 */
export async function createPullRequestNotification(
  data: NotificationInput
): Promise<NotificationDTO | null> {
  await connectDB();

  const repo = data.meta.repo;
  const prNumber = data.meta.prNumber;
  const action = data.meta.prAction;
  const newPriority = prActionPriority(action);

  if (!repo || prNumber == null || !action) {
    return createNotification(data);
  }

  const existing = await Notification.find({
    organizationId: data.organizationId,
    type: "pull_request",
    "meta.repo": repo,
    "meta.prNumber": prNumber,
    createdAt: { $gte: new Date(Date.now() - BANNER_TTL_MS) },
  }).lean();

  const maxExistingPriority = existing.reduce(
    (max, doc) => Math.max(max, prActionPriority(doc.meta?.prAction)),
    0
  );

  if (maxExistingPriority >= newPriority) {
    return null;
  }

  const created = await createNotification(data);
  if (!created) {
    return null;
  }

  const obsoleteIds = existing
    .filter((doc) => prActionPriority(doc.meta?.prAction) < newPriority)
    .map((doc) => doc._id);

  if (obsoleteIds.length > 0) {
    await Notification.deleteMany({ _id: { $in: obsoleteIds } });
  }

  return created;
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
    .limit(limit * 3)
    .lean();

  const collapsed = collapseNotificationsForBanner(
    docs.map((d) => serializeDoc<NotificationDTO>(d)!)
  );

  return collapsed.slice(0, limit);
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

export async function deletePersonalNotification(
  notificationId: string,
  recipientClerkId: string
): Promise<boolean> {
  await connectDB();
  const result = await Notification.findOneAndDelete({
    _id: notificationId,
    recipientClerkId,
    type: "reaction",
  });
  return !!result;
}

export async function dismissOrgNotification(
  orgId: string,
  notificationId: string
): Promise<boolean> {
  await connectDB();
  const result = await Notification.findOneAndDelete({
    _id: notificationId,
    organizationId: orgId,
    type: { $in: ["push", "pull_request"] },
  });

  if (!result) return false;

  const notifications = await listRecentNotifications(orgId);
  await syncBannerCache(orgId, notifications);
  return true;
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
