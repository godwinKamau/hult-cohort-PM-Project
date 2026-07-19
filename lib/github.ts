import { clerkClient } from "@clerk/nextjs/server";
import { createHmac, timingSafeEqual } from "crypto";
import { ALL_BRANCHES, isAllBranches } from "@/lib/github-branches";

export { ALL_BRANCHES, branchLabel, isAllBranches } from "@/lib/github-branches";

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

export function normalizeGithubOwner(owner: string): string {
  return owner.trim().replace(/^@/, "");
}

export function parseRepoFullName(fullName: string): {
  owner: string;
  repo: string;
} {
  const trimmed = fullName.trim();
  const slashIndex = trimmed.indexOf("/");
  if (slashIndex <= 0) {
    return { owner: "", repo: trimmed };
  }

  return {
    owner: trimmed.slice(0, slashIndex),
    repo: trimmed.slice(slashIndex + 1),
  };
}

export function normalizeRepoTarget(
  ownerInput: string,
  repoInput: string
): { owner: string; repo: string } | null {
  const owner = normalizeGithubOwner(ownerInput);
  const repo = normalizeRepoName(repoInput, owner);

  if (!owner || !repo || owner.includes("/") || repo.includes("/")) {
    return null;
  }

  return { owner, repo };
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

export async function listGithubReposForOwner(
  token: string,
  owner: string
): Promise<string[]> {
  const normalizedOwner = normalizeGithubOwner(owner);
  if (!normalizedOwner) return [];

  const repos = new Set<string>();
  let page = 1;

  while (true) {
    const response = await fetch(
      `https://api.github.com/user/repos?affiliation=owner,organization_member,collaborator&sort=updated&per_page=100&page=${page}`,
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

    const data = (await response.json()) as { name: string; owner: { login: string } }[];
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    for (const repo of data) {
      if (repo.owner.login.toLowerCase() === normalizedOwner.toLowerCase()) {
        repos.add(repo.name);
      }
    }

    if (data.length < 100) {
      break;
    }

    page += 1;
  }

  return [...repos].sort((left, right) => left.localeCompare(right));
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

export interface GithubRepoEvent {
  id: string;
  type: string;
  actor: { login: string };
  repo: { name: string };
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ParsedRepoEvent {
  type: "push" | "pull_request";
  repoFullName: string;
  branch: string;
  actorGithubLogin: string;
  eventId: string;
  createdAt: string;
  title: string;
  commitCount?: number;
  commitMessage?: string;
  prNumber?: number;
  prAction?: string;
  url?: string;
  headSha?: string;
  beforeSha?: string;
}

const ZERO_SHA = "0000000000000000000000000000000000000000";

function buildPushTitle(
  branch: string,
  commitCount: number,
  commitMessage?: string
): string {
  if (commitMessage) {
    return commitCount <= 1
      ? `push to ${branch}: "${commitMessage}"`
      : `push to ${branch} (${commitCount} commits): "${commitMessage}"`;
  }

  return commitCount <= 1
    ? `push to ${branch}`
    : `push to ${branch} (${commitCount} commits)`;
}

async function getCommitSummary(
  token: string,
  owner: string,
  repo: string,
  sha: string
): Promise<{ message: string; url: string } | null> {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${sha}`,
    {
      headers: {
        ...GITHUB_API_HEADERS,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    commit?: { message?: string };
    html_url?: string;
  };
  const rawMessage = data.commit?.message;
  if (!rawMessage) {
    return null;
  }

  return {
    message: firstCommitLine(rawMessage),
    url: data.html_url ?? `https://github.com/${owner}/${repo}/commit/${sha}`,
  };
}

async function comparePushCommits(
  token: string,
  owner: string,
  repo: string,
  before: string,
  head: string
): Promise<{ commitCount: number; commitMessage?: string; url: string } | null> {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/compare/${before}...${head}`,
    {
      headers: {
        ...GITHUB_API_HEADERS,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    total_commits?: number;
    html_url?: string;
    commits?: { commit?: { message?: string } }[];
  };

  const commits = data.commits ?? [];
  const commitCount = data.total_commits ?? commits.length;
  const rawMessage = commits.at(-1)?.commit?.message;

  return {
    commitCount,
    commitMessage: rawMessage ? firstCommitLine(rawMessage) : undefined,
    url:
      data.html_url ??
      `https://github.com/${owner}/${repo}/compare/${before}...${head}`,
  };
}

export async function enrichPushEvent(
  token: string,
  owner: string,
  repo: string,
  parsed: ParsedRepoEvent
): Promise<ParsedRepoEvent> {
  const head = parsed.headSha;
  if (!head) {
    return parsed;
  }

  const before = parsed.beforeSha ?? "";
  if (before && before !== ZERO_SHA && before !== head) {
    const compared = await comparePushCommits(token, owner, repo, before, head);
    if (compared) {
      return {
        ...parsed,
        commitCount: compared.commitCount,
        commitMessage: compared.commitMessage,
        url: compared.url,
        title: buildPushTitle(
          parsed.branch,
          compared.commitCount,
          compared.commitMessage
        ),
      };
    }
  }

  const commit = await getCommitSummary(token, owner, repo, head);
  if (!commit) {
    return parsed;
  }

  return {
    ...parsed,
    commitCount: 1,
    commitMessage: commit.message,
    url: commit.url,
    title: buildPushTitle(parsed.branch, 1, commit.message),
  };
}

export async function listRepoEvents(
  token: string,
  owner: string,
  repo: string,
  etag?: string | null
): Promise<{
  events: GithubRepoEvent[];
  etag: string | null;
  notModified: boolean;
}> {
  const headers: Record<string, string> = {
    ...GITHUB_API_HEADERS,
    Authorization: `Bearer ${token}`,
  };

  if (etag) {
    headers["If-None-Match"] = etag;
  }

  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/events?per_page=100`,
    { headers }
  );

  if (response.status === 304) {
    return { events: [], etag: etag ?? null, notModified: true };
  }

  if (response.status === 404) {
    throw new Error("Repository not found or you do not have access");
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const events = (await response.json()) as GithubRepoEvent[];
  const nextEtag = response.headers.get("etag");

  return {
    events: Array.isArray(events) ? events : [],
    etag: nextEtag,
    notModified: false,
  };
}

export function parseRepoEvent(
  event: GithubRepoEvent,
  targetBranch: string
): ParsedRepoEvent | null {
  const repoFullName = event.repo.name;
  const actorGithubLogin = event.actor.login;
  const eventId = event.id;
  const createdAt = event.created_at;

  if (event.type === "PushEvent") {
    const payload = event.payload as {
      ref?: string;
      size?: number;
      distinct_size?: number;
      commits?: { message?: string }[];
      head?: string;
      before?: string;
    };

    const ref = payload.ref ?? "";
    const branch = ref.replace("refs/heads/", "");
    if (!isAllBranches(targetBranch) && branch !== targetBranch) {
      return null;
    }

    const head = payload.head;
    const url = head
      ? `https://github.com/${repoFullName}/commit/${head}`
      : `https://github.com/${repoFullName}`;

    // GitHub's Events API no longer includes commits/size; enrich via REST API.
    const legacyCount = Math.max(
      payload.size ?? 0,
      payload.distinct_size ?? 0,
      payload.commits?.length ?? 0
    );
    const legacyMessage = payload.commits?.at(-1)?.message
      ? firstCommitLine(payload.commits.at(-1)!.message!)
      : undefined;

    const commitCount = legacyCount || (head ? 1 : 0);
    const title = buildPushTitle(branch, commitCount, legacyMessage);

    return {
      type: "push",
      repoFullName,
      branch,
      actorGithubLogin,
      eventId,
      createdAt,
      title,
      commitCount: legacyCount || undefined,
      commitMessage: legacyMessage,
      url,
      headSha: head,
      beforeSha: payload.before,
    };
  }

  if (event.type === "PullRequestEvent") {
    const payload = event.payload as {
      action?: string;
      pull_request?: {
        number: number;
        title: string;
        html_url: string;
        head: { ref: string };
        base: { ref: string };
      };
    };

    const pullRequest = payload.pull_request;
    if (
      !pullRequest ||
      (!isAllBranches(targetBranch) && pullRequest.base.ref !== targetBranch)
    ) {
      return null;
    }

    return {
      type: "pull_request",
      repoFullName,
      branch: pullRequest.head.ref,
      actorGithubLogin,
      eventId,
      createdAt,
      title: `PR #${pullRequest.number}: ${pullRequest.title} (${payload.action ?? "updated"})`,
      prNumber: pullRequest.number,
      prAction: payload.action,
      url: pullRequest.html_url,
    };
  }

  return null;
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
