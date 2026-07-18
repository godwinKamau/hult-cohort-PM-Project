import { createHmac, timingSafeEqual } from "crypto";

export function verifyGithubSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const received = signatureHeader.replace("sha256=", "");

  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex")
    );
  } catch {
    return false;
  }
}

export interface GithubPushPayload {
  ref: string;
  repository: { full_name: string; html_url: string };
  pusher: { name: string; email?: string };
  sender?: { login: string };
  commits?: { message?: string }[];
  head_commit?: { url?: string; message?: string };
}

function firstCommitLine(message: string): string {
  return message.split("\n")[0]?.trim() ?? message.trim();
}

export interface GithubPRPayload {
  action: string;
  pull_request: {
    number: number;
    title: string;
    html_url: string;
    head: { ref: string };
  };
  repository: { full_name: string; html_url: string };
  sender: { login: string };
}

export function parsePushPayload(payload: GithubPushPayload) {
  const branch = payload.ref.replace("refs/heads/", "");
  const commitCount = payload.commits?.length ?? 0;
  const rawMessage =
    payload.head_commit?.message ??
    payload.commits?.at(-1)?.message ??
    payload.commits?.[0]?.message;
  const commitMessage = rawMessage
    ? firstCommitLine(rawMessage)
    : undefined;

  const title = commitMessage
    ? commitCount <= 1
      ? `push to ${branch}: "${commitMessage}"`
      : `push to ${branch} (${commitCount} commits): "${commitMessage}"`
    : `push to ${branch} (${commitCount} commits)`;

  return {
    repoFullName: payload.repository.full_name,
    branch,
    actorGithubLogin: payload.sender?.login ?? payload.pusher.name,
    commitCount,
    commitMessage,
    url: payload.head_commit?.url ?? payload.repository.html_url,
    title,
  };
}

export function parsePRPayload(payload: GithubPRPayload) {
  return {
    repoFullName: payload.repository.full_name,
    branch: payload.pull_request.head.ref,
    actorGithubLogin: payload.sender.login,
    prNumber: payload.pull_request.number,
    prAction: payload.action,
    url: payload.pull_request.html_url,
    title: `PR #${payload.pull_request.number}: ${payload.pull_request.title} (${payload.action})`,
  };
}
