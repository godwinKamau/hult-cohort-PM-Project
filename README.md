# PM Platform

Org-scoped project management / ticketing platform with GitHub activity banner and 👍 reactions.

## Deploy URL

Set after Vercel deployment.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind v4
- **MongoDB Atlas** + Mongoose (serverless connection caching)
- **Clerk Organizations** (GitHub sign-in, org-scoped tenancy)
- **Upstash Redis** (HTTP — banner queue, poll throttling, org presence, reaction counts)
- **SWR polling** for banner feed and GitHub activity ingestion (no WebSockets)

## Setup

```bash
cp .env.example .env.local
# Fill in MongoDB, Clerk, Upstash, and optionally GitHub webhook secret
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Clerk setup

1. Create a Clerk application with **Organizations** enabled
2. Enable **GitHub** as the sign-in provider (GitHub-only auth is supported)
3. In Social Connections → GitHub, enable **OAuth token retrieval** and scopes that allow repo read (`public_repo` or `repo` for private repos). Users may need to sign out and back in once after changing scopes.
4. Add webhook endpoint: `https://your-domain/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `organization.created`, `organization.updated`
5. Copy `CLERK_WEBHOOK_SIGNING_SECRET` to env

The signed-in user's GitHub login is synced automatically into `User.githubUsername` and shown read-only on the dashboard. It is used to attribute push/PR activity in the banner.

### MongoDB setup

1. Create Atlas cluster (M0 free tier OK)
2. Allowlist `0.0.0.0/0` (serverless has no fixed IPs)
3. Use separate databases for prod (`pm_prod`) and preview (`pm_preview`)

### Link a GitHub repo (project settings)

Each project can track one repo + branch:

1. Open a project → `settings()`
2. Enter the **owner** (any GitHub username) and **repo name**
3. Click `verify_repo()` — checks access via your Clerk GitHub token and loads branches from GitHub
4. Select a branch from the dropdown and click `link_repo()`

The owner defaults to your signed-in GitHub username when linking a new repo, but you can change it to track repos like `rogerSuperBuilderAlpha/hult-cohort-program`.

Repo linking uses the GitHub REST API (verify + list branches). No webhook is required for basic activity tracking.

### GitHub activity (polling — default path)

While a user has the app open in a visible browser tab, the banner polls `GET /api/poll/github` every ~20s. That route:

1. Loads the org's linked repos (repo + branch per project)
2. Uses the online user's Clerk GitHub OAuth token
3. Fetches `GET /repos/{owner}/{repo}/events` (with ETag caching and per-repo Redis throttling)
4. Keeps `PushEvent` and `PullRequestEvent` on the configured branch
5. Enriches push details via the GitHub Compare/Commits API (GitHub no longer includes commit messages in Events API payloads)
6. Dedupes with `deliveryId: gh:{eventId}` and writes to the same notification/banner pipeline as webhooks

**Expect ~20–60s latency** (client interval + throttle + GitHub's event cache). Polling only runs while a tab is open (`refreshWhenHidden: false`).

**Requirements:** at least one signed-in user with a valid GitHub token must have the app open, and that token must have read access to the linked repo.

### Online presence

Click **status: online** in the activity banner to see who else is online in your organization.

- Visible app tabs heartbeat every **30 seconds** to `POST /api/presence/heartbeat`
- Entries expire after **90 seconds** without a heartbeat (hidden/closed tabs drop off)
- Presence is scoped to the **active Clerk organization**; each tab gets its own session ID
- The dropdown polls `GET /api/presence` every 30 seconds while the tab is visible
- Requires Upstash Redis; if Redis is unavailable, the dropdown shows `presence_unavailable`

### GitHub webhooks (optional)

Webhooks remain supported for lower-latency, repo-wide activity (all contributors, even when no one has the app open). They are optional if polling meets your needs.

Per linked project repo:

1. Settings → Webhooks → Add webhook
2. Payload URL: `https://your-production-domain/api/webhooks/github`
3. Content type: `application/json`
4. Secret: same as `GITHUB_WEBHOOK_SECRET`
5. Events: `push`, `Pull requests`

Local testing:

```bash
gh webhook forward --repo owner/repo --events push,pull_request --url http://localhost:3000/api/webhooks/github
# or
npx tsx scripts/send-test-webhook.ts
```

| Approach | Latency | Setup | Who's activity |
|----------|---------|-------|----------------|
| **Polling** (default) | ~20–60s | Link repo in project settings | All contributors on linked repo (user-agnostic), while someone has the app open |
| **Webhook** (optional) | Seconds | Per-repo webhook on GitHub | All contributors, always |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js     │────▶│  MongoDB    │
│  SWR poll   │     │  (Vercel)    │     │  (source    │
│  banner 15s │     │              │     │   of truth) │
│  github 20s │     │  Server      │     └─────────────┘
└─────────────┘     │  Actions +   │            ▲
       │            │  API Routes  │            │
       │            └──────┬───────┘            │
       ▼                   │                    │
┌─────────────┐            ▼                    │
│   Clerk     │     ┌─────────────┐            │
│ GitHub OAuth│────▶│  Upstash    │────────────┘
│  + orgs     │     │  Redis      │  (banner cache,
└─────────────┘     │             │   poll locks/ETags,
                    └──────┬──────┘   presence, reactions)
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       ┌─────────────┐           ┌─────────────┐
       │ GitHub REST │           │ GitHub      │
       │ repo events │           │ webhooks    │
       │ + compare   │           │ (optional)  │
       └─────────────┘           └─────────────┘
```

## Env vars

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URI` | Yes | Atlas SRV string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Dev for preview, prod for production |
| `CLERK_SECRET_KEY` | Yes | Match publishable key instance |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Yes | Svix secret from Clerk dashboard |
| `UPSTASH_REDIS_REST_URL` | Yes* | *Banner/reactions/presence/poll throttling degrade without Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Yes* | |
| `GITHUB_WEBHOOK_SECRET` | No* | *Required only if using GitHub webhooks |

## Smoke test (≤5 min)

1. Sign in with GitHub → create org → invite second user
2. Confirm dashboard shows your locked `@github_username`
3. Create project → link repo (`verify_repo()` → pick branch → `link_repo()`)
4. Create tickets, assign, filter by assignee
5. Drag ticket on Kanban board → refresh → persists
6. Open `?ticket=` URL → side-peek works
7. Keep the app open, push to the linked branch → banner shows event within ~20–60s with commit message
8. 👍 reaction → count updates, pusher gets inbox notification
9. Click `status: online` → see other org members with the app open
10. `/api/health` returns `{ ok: true }`

## Known limitations (v1)

- No WebSockets/SSE — banner, presence, and GitHub ingestion use SWR polling
- GitHub activity polling requires an open app tab and a user token with repo read access
- Repo owner in project settings can be any GitHub username; your token must still have read access to that repo for verify/polling
- GitHub Events API no longer includes commit payloads; push titles are enriched via Compare/Commits REST calls
- Single shared GitHub webhook secret when webhooks are used (not a GitHub App)
- Last-write-wins on ticket position conflicts
- No email notifications or metrics dashboard

## UI attribution

Visual design adapted from the [Hacker-Themed Creative Portfolio (Community)](https://www.figma.com/design/ezhptI6iLki1WAtSA1bg5Q/Hacker-Themed-Creative-Portfolio--Community-) Figma community file. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

## License

MIT

## Testing PRs
delete later.
test 2
