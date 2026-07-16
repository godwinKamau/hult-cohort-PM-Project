/**
 * Send a test GitHub push webhook to local dev server.
 * Usage: npx tsx scripts/send-test-webhook.ts [repo] [branch]
 */
import { createHmac } from "crypto";

const secret = process.env.GITHUB_WEBHOOK_SECRET ?? "test-secret";
const repo = process.argv[2] ?? "owner/pm-platform";
const branch = process.argv[3] ?? "main";
const url = process.env.WEBHOOK_URL ?? "http://localhost:3000/api/webhooks/github";

const payload = {
  ref: `refs/heads/${branch}`,
  repository: {
    full_name: repo,
    html_url: `https://github.com/${repo}`,
  },
  pusher: { name: "test-user", email: "test@example.com" },
  sender: { login: "test-user" },
  commits: [{ message: "test commit" }, { message: "another commit" }],
  head_commit: { url: `https://github.com/${repo}/commit/abc123` },
};

const body = JSON.stringify(payload);
const signature =
  "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
const deliveryId = `test-${Date.now()}`;

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

console.log(`Status: ${res.status}`);
console.log(await res.json());
