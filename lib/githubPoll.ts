import { ALL_BRANCHES, enrichPushEvent, listRepoEvents, parseRepoEvent } from "@/lib/github";
import {
  getRedis,
  POLL_LOOKBACK_MS,
  REPO_POLL_THROTTLE_MS,
  redisKeys,
} from "@/lib/redis";
import * as notificationRepo from "@/repositories/notifications";
import * as projectRepo from "@/repositories/projects";

interface RepoPollTarget {
  repoFullName: string;
  branch: string;
  projectId: string;
}

function splitRepoFullName(repoFullName: string): { owner: string; repo: string } | null {
  const slashIndex = repoFullName.indexOf("/");
  if (slashIndex <= 0) return null;

  return {
    owner: repoFullName.slice(0, slashIndex),
    repo: repoFullName.slice(slashIndex + 1),
  };
}

async function acquirePollLock(repoFullName: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true;

  const result = await redis.set(redisKeys.pollLock(repoFullName), "1", {
    nx: true,
    px: REPO_POLL_THROTTLE_MS,
  });

  return result === "OK";
}

async function pollRepoEvents(
  orgId: string,
  token: string,
  target: RepoPollTarget
): Promise<void> {
  const lockAcquired = await acquirePollLock(target.repoFullName);
  if (!lockAcquired) {
    return;
  }

  const parts = splitRepoFullName(target.repoFullName);
  if (!parts) {
    return;
  }

  const redis = getRedis();
  const storedEtag = redis
    ? await redis.get<string>(redisKeys.pollEtag(target.repoFullName))
    : null;

  const { events, etag, notModified } = await listRepoEvents(
    token,
    parts.owner,
    parts.repo,
    storedEtag
  );

  if (notModified) {
    return;
  }

  if (redis && etag) {
    await redis.set(redisKeys.pollEtag(target.repoFullName), etag);
  }

  const cutoff = Date.now() - POLL_LOOKBACK_MS;

  for (const event of events) {
    const eventTime = Date.parse(event.created_at);
    if (Number.isNaN(eventTime) || eventTime < cutoff) {
      continue;
    }

    let parsed = parseRepoEvent(event, target.branch);
    if (!parsed) {
      continue;
    }

    if (parsed.type === "push") {
      parsed = await enrichPushEvent(token, parts.owner, parts.repo, parsed);
    }

    const pusherClerkId = await notificationRepo.findUserByGithubUsername(
      parsed.actorGithubLogin
    );

    const notification = await notificationRepo.createNotification({
      organizationId: orgId,
      projectId: target.projectId,
      type: parsed.type,
      title: parsed.title,
      meta: {
        repo: parsed.repoFullName,
        branch: parsed.branch,
        actorGithubLogin: parsed.actorGithubLogin,
        commitCount: parsed.commitCount,
        commitMessage: parsed.commitMessage,
        prNumber: parsed.prNumber,
        prAction: parsed.prAction,
        url: parsed.url,
      },
      pusherClerkId: pusherClerkId ?? undefined,
      deliveryId: `gh:${parsed.eventId}`,
    });

    if (!notification) {
      continue;
    }

    try {
      await notificationRepo.enqueueBannerItem(orgId, {
        ...notification,
        reacted: false,
      });
    } catch (err) {
      console.error("Redis enqueue failed during poll:", err);
    }
  }
}

export async function pollOrgGithubEvents({
  orgId,
  token,
}: {
  orgId: string;
  token: string;
}): Promise<void> {
  const projects = await projectRepo.listOrgProjects(orgId);
  const repoTargets = new Map<string, RepoPollTarget>();

  for (const project of projects) {
    const repoFullName = project.github.repoFullName?.trim();
    if (!repoFullName) continue;

    const branch = project.github.branch?.trim() || ALL_BRANCHES;
    const key = `${repoFullName}:${branch}`;

    if (!repoTargets.has(key)) {
      repoTargets.set(key, {
        repoFullName,
        branch,
        projectId: project.id,
      });
    }
  }

  for (const target of repoTargets.values()) {
    try {
      await pollRepoEvents(orgId, token, target);
    } catch (err) {
      console.error(`Poll failed for ${target.repoFullName}:`, err);
    }
  }
}
