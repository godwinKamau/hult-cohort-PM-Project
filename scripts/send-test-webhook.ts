/**
 * Send a test GitHub push webhook to local dev server.
 * Usage: npx tsx scripts/send-test-webhook.ts [repo] [branch]
 *
 * If repo/branch are omitted, uses the first non-archived project's GitHub config.
 */
import { createHmac } from "crypto";
import { loadEnvConfig } from "@next/env";
import { connectDB } from "../lib/db";
import { Project, User } from "../models";

loadEnvConfig(process.cwd());

const secret = process.env.GITHUB_WEBHOOK_SECRET ?? "test-secret";
const url = process.env.WEBHOOK_URL ?? "http://localhost:3000/api/webhooks/github";

async function resolveSender(): Promise<string> {
  await connectDB();
  const user = await User.findOne({
    githubUsername: { $exists: true, $nin: [null, ""] },
  })
    .sort({ updatedAt: -1 })
    .lean();

  return user?.githubUsername ?? "test-user";
}

async function resolveTarget(): Promise<{ repo: string; branch: string }> {
  const repoArg = process.argv[2];
  const branchArg = process.argv[3];

  if (repoArg) {
    return { repo: repoArg, branch: branchArg ?? "main" };
  }

  await connectDB();
  const project = await Project.findOne({ archived: false })
    .sort({ updatedAt: -1 })
    .lean();

  if (!project?.github?.repoFullName) {
    console.error(
      "No repo argument and no project with github.repoFullName found in MongoDB."
    );
    console.error(
      "Usage: npx tsx scripts/send-test-webhook.ts <owner/repo> [branch]"
    );
    process.exit(1);
  }

  return {
    repo: project.github.repoFullName,
    branch: project.github.branch ?? branchArg ?? "main",
  };
}

async function main() {
  const { repo, branch } = await resolveTarget();
  const sender = await resolveSender();

  const payload = {
    ref: `refs/heads/${branch}`,
    repository: {
      full_name: repo,
      html_url: `https://github.com/${repo}`,
    },
    pusher: { name: sender, email: `${sender}@users.noreply.github.com` },
    sender: { login: sender },
    commits: [
      { message: "feat: add ticket filters" },
      { message: "fix: board drag-and-drop" },
    ],
    head_commit: {
      url: `https://github.com/${repo}/commit/abc123`,
      message: "fix: board drag-and-drop",
    },
  };

  const body = JSON.stringify(payload);
  const signature =
    "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
  const deliveryId = `test-${Date.now()}`;

  console.log(`POST ${url}`);
  console.log(`Repo:   ${repo}`);
  console.log(`Branch: ${branch}`);
  console.log(`Actor:  @${sender}`);
  console.log(`Title:  push to ${branch} (2 commits): "fix: board drag-and-drop"`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Hub-Signature-256": signature,
      "X-GitHub-Event": "push",
      "X-GitHub-Delivery": deliveryId,
    },
    body,
  });

  const result = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(result);

  if (result.skipped === "no_project") {
    console.error(
      `\nNo project matched repo "${repo}" (branch "${branch}").`
    );
    console.error(
      "Set the project's GitHub repo in settings, or pass the correct repo:"
    );
    console.error(
      `  npx tsx scripts/send-test-webhook.ts ${repo} ${branch}`
    );
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error("Webhook test failed:", error);
  process.exitCode = 1;
});
