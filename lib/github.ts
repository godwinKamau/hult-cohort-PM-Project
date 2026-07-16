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
  commits?: { length: number }[];
  head_commit?: { url?: string };
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
  return {
    repoFullName: payload.repository.full_name,
    branch,
    actorGithubLogin: payload.sender?.login ?? payload.pusher.name,
    commitCount: payload.commits?.length ?? 0,
    url: payload.head_commit?.url ?? payload.repository.html_url,
    title: `push to ${branch} (${payload.commits?.length ?? 0} commits)`,
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
