import { clerkClient } from "@clerk/nextjs/server";
import { createHmac, timingSafeEqual } from "crypto";

const GITHUB_API_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
} as const;

export function normalizeRepoName(repoName: string, owner?: string): string {
  const trimmed = repoName.trim();
  if (!trimmed) return "";

  if (owner && trimmed.startsWith(`${owner}/`)) {
    return trimmed.slice(owner.length + 1);
  }

  const slashIndex = trimmed.indexOf("/");
  if (slashIndex > 0) {
    return trimmed.slice(slashIndex + 1);
  }

  return trimmed;
}

export async function getGithubAccessToken(
  userId: string
): Promise<string | null> {
  const client = await clerkClient();

  try {
    const response = await client.users.getUserOauthAccessToken(
      userId,
      "oauth_github"
    );
    const token = response.data[0]?.token;
    if (token) return token;
  } catch {
    // Token unavailable or provider not configured.
  }

  return null;
}

export async function verifyGithubRepo(
  token: string,
  owner: string,
  repo: string
): Promise<{ defaultBranch: string }> {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    {
      headers: {
        ...GITHUB_API_HEADERS,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 404) {
    throw new Error("Repository not found or you do not have access");
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = (await response.json()) as { default_branch?: string };
  return { defaultBranch: data.default_branch ?? "main" };
}

export async function listGithubBranches(
  token: string,
  owner: string,
  repo: string
): Promise<string[]> {
  const branches: string[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100&page=${page}`,
      {
        headers: {
          ...GITHUB_API_HEADERS,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = (await response.json()) as { name: string }[];
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    branches.push(...data.map((branch) => branch.name));

    if (data.length < 100) {
      break;
    }

    page += 1;
  }

  return branches;
}

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
