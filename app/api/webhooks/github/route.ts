import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  verifyGithubSignature,
  parsePushPayload,
  parsePRPayload,
  type GithubPushPayload,
  type GithubPRPayload,
} from "@/lib/github";
import * as projectRepo from "@/repositories/projects";
import * as notificationRepo from "@/repositories/notifications";

export async function POST(req: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error("GITHUB_WEBHOOK_SECRET not configured");
    return NextResponse.json({ ok: true, skipped: "no_secret" });
  }

  const headerPayload = await headers();
  const signature = headerPayload.get("x-hub-signature-256");
  const deliveryId = headerPayload.get("x-github-delivery");
  const event = headerPayload.get("x-github-event");

  const rawBody = await req.text();

  if (!verifyGithubSignature(rawBody, signature, secret)) {
    console.error("Invalid GitHub webhook signature");
    return NextResponse.json({ ok: true, skipped: "invalid_signature" });
  }

  if (!deliveryId || !event) {
    return NextResponse.json({ ok: true, skipped: "missing_headers" });
  }

  let payload: GithubPushPayload | GithubPRPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true, skipped: "invalid_json" });
  }

  if (event !== "push" && event !== "pull_request") {
    return NextResponse.json({ ok: true, skipped: "ignored_event" });
  }

  const parsed =
    event === "push"
      ? parsePushPayload(payload as GithubPushPayload)
      : parsePRPayload(payload as GithubPRPayload);

  const project = await projectRepo.findProjectByRepo(
    parsed.repoFullName,
    event === "push" ? parsed.branch : undefined
  );

  if (!project) {
    console.log(`No project found for repo: ${parsed.repoFullName}`);
    return NextResponse.json({ ok: true, skipped: "no_project" });
  }

  const pusherClerkId = await notificationRepo.findUserByGithubUsername(
    parsed.actorGithubLogin
  );

  const notification = await notificationRepo.createNotification({
    organizationId: project.organizationId,
    projectId: project.id,
    type: event === "push" ? "push" : "pull_request",
    title: parsed.title,
    meta: {
      repo: parsed.repoFullName,
      branch: parsed.branch,
      actorGithubLogin: parsed.actorGithubLogin,
      commitCount: "commitCount" in parsed ? parsed.commitCount : undefined,
      commitMessage: "commitMessage" in parsed ? parsed.commitMessage : undefined,
      prNumber: "prNumber" in parsed ? parsed.prNumber : undefined,
      prAction: "prAction" in parsed ? parsed.prAction : undefined,
      url: parsed.url,
    },
    pusherClerkId: pusherClerkId ?? undefined,
    deliveryId,
  });

  if (!notification) {
    return NextResponse.json({ ok: true, skipped: "duplicate" });
  }

  try {
    await notificationRepo.enqueueBannerItem(project.organizationId, {
      ...notification,
      reacted: false,
    });
  } catch (err) {
    console.error("Redis enqueue failed:", err);
  }

  return NextResponse.json({ ok: true, notificationId: notification.id });
}
