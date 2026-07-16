# Agent guide — PM Platform

## Project

Org-scoped PM/ticketing app for a ~30-user cohort. Next.js on Vercel, MongoDB, Clerk Organizations, Upstash Redis.

## Key rules

1. **Tenancy:** Every query filters by `organizationId` from `requireOrg()`. Never trust client-supplied org IDs.
2. **Data access:** Use `repositories/*.ts` — always pass `orgId` as first argument.
3. **Mutations:** Server Actions in `actions/*.ts` call `requireOrg()` then repository functions.
4. **External webhooks:** Route handlers at `app/api/webhooks/*` — must stay public in `middleware.ts`.
5. **Serialization:** Mongoose docs must go through `serializeDoc()` before crossing RSC boundaries.
6. **Redis:** Ephemeral only (banner queue, reaction counts). Mongo is source of truth with rebuild fallback.
7. **UI theme:** Hacker/terminal aesthetic from community Figma reference. Dense, mono, matrix green on near-black. No glitch/matrix-rain on board.

## File map

- `lib/auth.ts` — `requireOrg()`, `requireUser()`, `syncUserFromClerk()`
- `lib/db.ts` — cached Mongoose connect on `globalThis`
- `lib/redis.ts` — Upstash HTTP client + key helpers
- `models/` — Mongoose schemas with org-scoped indexes
- `repositories/` — data access layer (org-filtered)
- `actions/` — server actions for mutations
- `components/shell/` — AppHeader, AppShell
- `components/board/` — Kanban + list views
- `components/peek/` — side-peek sheet
- `components/banner/` — notification banner + reactions

## Common tasks

- Add a field to tickets: update `models/Ticket.ts`, `lib/types.ts`, repository, action, and peek UI.
- Add API endpoint: create route in `app/api/`, use `requireOrg()` for auth, add rate limiting if polled.
- Test webhooks locally: `npx tsx scripts/send-test-webhook.ts` or `gh webhook forward`.

## Gotchas

- Mongoose connection must be cached on `globalThis` (serverless)
- GitHub webhook needs raw body before JSON parse for HMAC
- Always return 200 to GitHub webhooks (4xx causes retry storms)
- Clerk middleware must exempt `/api/webhooks/*`
- SWR banner polls every 5s with `refreshWhenHidden: false`
