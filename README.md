# Veloce

**Repository:** [github.com/HassanRasoo98/veloce](https://github.com/HassanRasoo98/veloce) · Application code in [`veloce-frontend/`](veloce-frontend/).

Veloce is a full-stack intake and internal dashboard: public brief submission, AI-assisted analysis, Kanban pipeline, analytics, and role-based access. The stack is Next.js (App Router), MongoDB, optional Upstash Redis, and OpenAI.

---

## Data model decisions

Persistence uses the **MongoDB Node driver** (no ORM). Collections are normalized with **foreign-key-style** `brief_id` references (ObjectId) to `briefs`, plus embedded user id strings where needed.

| Collection | Purpose |
| --- | --- |
| `users` | Auth users (`email`, `password_hash`, `role`). |
| `briefs` | Intake records (`stage`, `submitted_at`, contact fields, etc.). |
| `aianalyses` | One analysis per brief (`brief_id` → `briefs._id`). |
| `stageevents` | Timeline of stage transitions (`brief_id`, `from_stage`, `to_stage`, `at`, actor). |
| `notes` | Threaded notes on a brief (`brief_id`, `parent_id`, `at`). |
| `assignments` | Reviewer assignments (`brief_id`, `assigned_to_id`, `at`). |
| `estimateoverrides` | Manual effort override per brief (`brief_id`). |
| `idempotencykeys` | Optional `Idempotency-Key` for intake/webhook (`key`, `brief_id`, TTL on `created_at`). |

**Stage changes** both **update** `briefs.stage` and **append** a `stageevents` document so history is explicit, not only an overwritten field.

**Indexes** match real access patterns: e.g. `briefs` uses `{ submitted_at: -1, _id: -1 }` for cursor pagination in the brief list; child collections use `brief_id` (and `{ brief_id: 1, at: -1 }` where sorted by time); `assignments` indexes `assigned_to_id` for reviewers; `users` has unique `email`; `idempotencykeys` has unique `key` and a TTL on `created_at` (7 days). A **replica set** (e.g. Atlas) is required for **transactions** on stage updates and for **change streams** feeding workspace events.

---

## Caching and invalidation strategy

**Analytics:** `GET /api/analytics/summary` aggregates in MongoDB with the same visibility rules as the brief list (admin: all; reviewer: assigned briefs only). When Redis (Upstash) is configured, responses are cached per user under `veloce:analytics:summary:{userId}` with a **120s TTL**.

**Invalidation:** A global generation counter in Redis (`veloce:analytics:gen`) is **incremented** after mutations that can change dashboard numbers or who can see which briefs:

- New brief (public intake and signed webhook intake)
- Stage change
- Assignment
- Notes and estimate overrides

Each cached entry records the generation at write time; on read, if the current generation differs, the handler **recomputes** from MongoDB. The TTL is a safety net if a process ever skips bumping the counter.

---

## AI pipeline design

1. **Intake** — Public and webhook routes validate payloads (Zod), then call `createBriefFromIntake` in `src/lib/server/brief-pipeline.ts`.
2. **Persist first** — A `briefs` document is inserted so submitters always get a stored record even if analysis fails later.
3. **Analysis** — `runBriefAnalysis` calls OpenAI with a fixed prompt and **structured output** validated with a Zod schema (`src/lib/server/openai-analyze.ts`), using `responses.parse`. Retries and backoff cover rate limits and transient 503s.
4. **Persist analysis** — Success writes `aianalyses` linked by `brief_id`; failure leaves the brief in place and returns `analysisError` to the client while logging on the server.

---

## AI tools used during development

- **Tools used:** [Cursor](https://cursor.com) only—no other AI coding assistants or chat tools for implementation.
- **How the app was built:** Development was from scratch in Cursor, starting from the [CodeAcme assessment](https://assessment.codeacme.com/) brief with an initial **UI mockup**, then the **backend** (Next.js Route Handlers, MongoDB, auth), **MongoDB indexing** (`scripts/create-indexes.ts`), **Upstash Redis** for rate limiting and analytics caching, and **OpenAI structured outputs** (Zod + `responses.parse`, retries) for brief analysis.
- **How I verified:** Local dev and production builds, plus manual testing of intake, dashboard, webhooks, and auth; iterative fixes wherever generated code did not match behavior, security, or data integrity.

---

## What we would improve given more time

- **User and org growth** — Today access is centered on **seeded accounts** (one admin and one reviewer). Next steps would include richer **multi-user** product support: self-service or invite-based onboarding, many staff accounts, optional organizations/teams, and admin UX to manage users without redeploying seeds.
- **Automated tests** — API integration tests (intake, authz, idempotency) and fixture-based checks around OpenAI parsing.
- **Observability** — Structured logging, request correlation, and clearer diagnostics for webhooks and failed analyses.
- **Operational hardening** — Queue-backed analysis so intake stays responsive under load; dead-letter or retry policies for failed analysis jobs.
- **Product polish** — Notifications on stage changes, richer analytics exports, and further workflow features as priorities become clear.
