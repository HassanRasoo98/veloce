# Veloce (Next.js)

Next.js App Router app: public intake, dashboard pipeline (Kanban), brief detail, analytics, and **API routes** (auth, briefs, users, webhooks) for deployment on **Vercel** with **MongoDB Atlas**, **OpenAI**, and optional **Upstash Redis**.

**Submission:** [Live deployment](https://veloce-rjbr8bqkp-hassan-rasools-projects.vercel.app) · [GitHub repository](https://github.com/HassanRasoo98/veloce)

## Environment

Copy [.env.local.example](.env.local.example) to `.env.local` and fill in values. Server routes need `MONGODB_URI`, `OPENAI_API_KEY`, `JWT_SECRET`, and `WEBHOOK_HMAC_SECRET` at minimum.

**Upstash Redis:** Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` together for production (rate limiting on public intake + signed webhook, and caching for `GET /api/analytics/summary`). If you omit both, those features are disabled so local development can run without Redis.

- **Same-origin (recommended):** leave `NEXT_PUBLIC_API_URL` unset. The browser calls `/api/...` on the same host as the UI (local `next dev` or Vercel).
- **Split dev:** set `NEXT_PUBLIC_API_URL=http://localhost:4000` only if the UI should talk to a separate API process.

### Vercel

Add the same variables in the project **Settings → Environment Variables**. Use **Node.js** runtime (default for App Router API routes). Intake and webhook routes set `maxDuration` to 60s; on **Hobby**, confirm your plan’s function limit or upgrade if OpenAI calls time out.

After deploy, run **indexes** and **seed** once against the same Atlas database:

```bash
npm run create-indexes
npm run seed-users
```

Defaults if seed env vars are omitted: `admin@veloce.local` / `admin123` and `reviewer@veloce.local` / `reviewer123`.

## Architecture and data model

Persistence uses the **MongoDB Node driver** (not Prisma). Collections mirror the prior Python/Beanie names:

| Collection | Purpose |
|------------|---------|
| `users` | Auth users (`email`, `password_hash`, `role`). |
| `briefs` | Intake records (`stage`, `submitted_at`, contact fields, etc.). |
| `aianalyses` | One analysis per brief (`brief_id` → `briefs._id`). |
| `stageevents` | Timeline of stage transitions (`brief_id`, `from_stage`, `to_stage`, `at`, actor). |
| `notes` | Threaded notes on a brief (`brief_id`, `parent_id`, `at`). |
| `assignments` | Reviewer assignments (`brief_id`, `assigned_to_id`, `at`). |
| `estimateoverrides` | Manual effort override per brief (`brief_id`). |
| `idempotencykeys` | Optional `Idempotency-Key` handling for intake/webhook (`key`, `brief_id`, TTL on `created_at`). |

Relations are **foreign-key style** via `brief_id` (ObjectId) and embedded user id strings where needed. Stage changes **update** `briefs.stage` and **append** a `stageevents` document (not only a silent field overwrite).

## Indexing strategy

Run `npm run create-indexes` after provisioning Atlas. Indexes support real query patterns:

- **`briefs`:** `{ submitted_at: -1, _id: -1 }` — matches cursor pagination and sort in `GET /api/briefs`.
- **Child collections:** `brief_id` (and `{ brief_id: 1, at: -1 }` where we sort by `at`) for analyses, events, notes, assignments, overrides.
- **`assignments`:** `assigned_to_id` — reviewer’s assigned brief list.
- **`users`:** unique `email` — login.
- **`idempotencykeys`:** unique `key`; TTL on `created_at` (7 days) to expire stale keys.

**Replica set:** Atlas M0+ clusters are replica sets. You need a replica set for **Mongo transactions** (stage PATCH) and **change streams** (`GET /api/workspace/events` SSE).

## Performance and caching

- **Cursor pagination:** `GET /api/briefs` uses `(submitted_at, _id)` cursors, not offset/limit paging.
- **Brief detail:** `GET /api/briefs/[id]` runs independent reads in `Promise.all` after authz.
- **Analytics:** `GET /api/analytics/summary` aggregates from MongoDB with the same visibility rules as the brief list (admin: all; reviewer: assigned briefs only). When Upstash is configured, responses are cached per user under `veloce:analytics:summary:{userId}` with a 120s TTL.

### Analytics cache invalidation

A global generation counter in Redis (`veloce:analytics:gen`) is **incremented** after mutations that can change dashboard numbers or visibility:

- New brief (public `POST /api/briefs`, `POST /api/webhooks/intake`)
- Stage change (`PATCH .../stage`)
- Assignment (`POST .../assign`)
- Notes and estimate overrides (`POST .../notes`, `POST .../estimate-override`)

Cached entries store the generation at write time; if the counter changed, the next read recomputes from MongoDB. TTL is a safety net if a process skips invalidation.

### Rate limiting

When Upstash is enabled, **sliding-window** limits apply:

- **Public intake** `POST /api/briefs` — per client IP (`x-forwarded-for` / `x-real-ip`).
- **Webhook** `POST /api/webhooks/intake` — after HMAC verification, per IP (invalid signatures do not consume the webhook quota).

Exceeded limits return **429** with `{ "detail": "..." }`.

## Real-time and UX

- **SSE:** `GET /api/workspace/events` watches relevant collections; the dashboard client debounces refreshes on `workspace_changed`.
- **Kanban:** Optimistic stage updates with rollback on API error (`src/lib/veloce-store.tsx`).
- **Loading:** `src/app/dashboard/loading.tsx` and `PipelineSkeleton` for route-level and Suspense fallbacks.

## Idempotency

`POST /api/briefs` and signed `POST /api/webhooks/intake` accept optional header **`Idempotency-Key`** (trimmed, max 200 chars). Keys are namespaced internally (`intake:…` / `webhook:…`). Concurrent duplicate keys receive **409** while the first request is in flight; completed keys replay the stored brief payload (analysis error text is not preserved on replay).

The public intake form sends a per-submit UUID when the Web Crypto API is available.

## AI pipeline design

1. **Intake** — Public `POST /api/briefs` and signed `POST /api/webhooks/intake` validate payloads (Zod), then call `createBriefFromIntake` in `src/lib/server/brief-pipeline.ts`.
2. **Persist first** — A `briefs` document is inserted so the user always gets a record even if analysis fails downstream.
3. **Analysis** — `runBriefAnalysis` calls OpenAI with a fixed prompt and **structured output** parsed against a Zod schema (`src/lib/server/openai-analyze.ts`). Retries and backoff cover rate limits and transient 503s.
4. **Persist analysis** — On success, an `aianalyses` document is written and linked by `brief_id`; on failure, the brief remains and `analysisError` is surfaced to the client (and logged server-side).

## AI integration

OpenAI structured output uses Zod via `responses.parse`, with retries and backoff for rate limits and 503s (`src/lib/server/openai-analyze.ts`). Briefs persist even when analysis fails; `analysisError` is returned to the client.

## AI tools used during development

- **Tools used:** [Cursor](https://cursor.com) only—no other AI coding assistants or chat tools for implementation.
- **How the app was built:** The project was developed from scratch in Cursor. I started from the [CodeAcme assessment](https://assessment.codeacme.com/) brief and first generated a **UI mockup** to align the product surface with the requirements. I then implemented the **backend** (Next.js Route Handlers, MongoDB persistence, auth), added **MongoDB indexing** (`scripts/create-indexes.ts`), wired **Upstash Redis** for rate limiting and analytics caching, and implemented **OpenAI structured outputs** (Zod + `responses.parse`, retries) for brief analysis.
- **How I verified:** Local `npm run dev` / `npm run build`, manual exercise of intake, dashboard, webhooks, and auth flows; fixes and refactors applied wherever generated code did not match behavior, security, or data integrity needs.

## What we would improve given more time

- **User and org growth** — Today access is centered on **seeded accounts** (one admin and one reviewer). With more time I would add **multi-user** support in the product sense: self-service or invite-based onboarding, many staff accounts, optional organizations/teams, and admin UX to manage users without redeploying seeds.
- **Automated tests** — API route integration tests (intake, authz, idempotency) and fixture-based checks around OpenAI parsing.
- **Observability** — Structured logging, request correlation, and clearer production diagnostics for webhooks and failed analyses.
- **Operational hardening** — Queue-backed analysis so intake stays responsive under load; dead-letter or retry policies for failed analysis jobs.
- **Product polish** — Notifications on stage changes, richer analytics exports, and additional workflow features as priorities emerge.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). **Dashboard** requires sign-in. Public **Submit brief** works without login.

Health check: `GET /api/health` (also `GET /health` via rewrite in [vercel.json](vercel.json)).

## Assessment context

Product scope aligns with the [CodeAcme assessment](https://assessment.codeacme.com/). AI-tool disclosure for this submission is documented above under **AI tools used during development**.

## Git hygiene (submissions)

Prefer **small, focused commits** with clear messages (e.g. `feat: analytics summary + redis cache`, `docs: indexing and evaluation map`) so reviewers can follow intent.
