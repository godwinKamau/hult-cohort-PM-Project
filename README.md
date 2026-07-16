# PM Platform

Org-scoped project management / ticketing platform with GitHub activity banner and 👍 reactions.

## Deploy URL

Set after Vercel deployment.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind v4
- **MongoDB Atlas** + Mongoose (serverless connection caching)
- **Clerk Organizations** (email invitations, org-scoped tenancy)
- **Upstash Redis** (HTTP — banner queue, reaction counts)
- **SWR polling** (~5s) for realtime-feeling banner (no WebSockets)

## Setup

```bash
cp .env.example .env.local
# Fill in MongoDB, Clerk, Upstash, GitHub webhook secret
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Clerk setup

1. Create a Clerk application with **Organizations** enabled
2. Enable email invitations in Organization settings
3. Add webhook endpoint: `https://your-domain/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `organization.created`, `organization.updated`
4. Copy `CLERK_WEBHOOK_SIGNING_SECRET` to env

### MongoDB setup

1. Create Atlas cluster (M0 free tier OK)
2. Allowlist `0.0.0.0/0` (serverless has no fixed IPs)
3. Use separate databases for prod (`pm_prod`) and preview (`pm_preview`)

### GitHub webhook setup

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

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│  Next.js     │────▶│  MongoDB    │
│  (SWR 5s)   │     │  (Vercel)    │     │  (source    │
└─────────────┘     │              │     │   of truth) │
       │            │  Server      │     └─────────────┘
       │            │  Actions +   │            ▲
       │            │  API Routes  │            │
       ▼            └──────┬───────┘            │
┌─────────────┐            │                    │
│   Clerk     │            ▼                    │
│   (auth +   │     ┌─────────────┐            │
│    orgs)    │     │  Upstash    │────────────┘
└─────────────┘     │  Redis      │  (fallback rebuild)
                    │  (banner +  │
┌─────────────┐     │   reactions)│
│   GitHub    │────▶└─────────────┘
│  webhooks   │
└─────────────┘
```

## Env vars

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URI` | Yes | Atlas SRV string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Dev for preview, prod for production |
| `CLERK_SECRET_KEY` | Yes | Match publishable key instance |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Yes | Svix secret from Clerk dashboard |
| `UPSTASH_REDIS_REST_URL` | Yes* | *Banner/reactions degrade to Mongo-only |
| `UPSTASH_REDIS_REST_TOKEN` | Yes* | |
| `GITHUB_WEBHOOK_SECRET` | Yes | Shared secret for repo webhooks |

## Smoke test (≤5 min)

1. Sign up → create org → invite second user
2. Create project, link GitHub repo
3. Create tickets, assign, filter by assignee
4. Drag ticket on Kanban board → refresh → persists
5. Open `?ticket=` URL → side-peek works
6. Push to linked repo → banner shows event within ~5s
7. 👍 reaction → count updates, pusher gets inbox notification
8. `/api/health` returns `{ ok: true }`

## Known limitations (v1)

- Polling only (no WebSockets/SSE)
- Single shared GitHub webhook secret (not GitHub App)
- Last-write-wins on ticket position conflicts
- No email notifications or metrics dashboard

## UI attribution

Visual design adapted from the [Hacker-Themed Creative Portfolio (Community)](https://www.figma.com/design/ezhptI6iLki1WAtSA1bg5Q/Hacker-Themed-Creative-Portfolio--Community-) Figma community file. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

## License

MIT
