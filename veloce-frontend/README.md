# Veloce (Next.js)

Next.js App Router app: public intake, dashboard pipeline (Kanban), brief detail, analytics, and **API routes** (auth, briefs, users, webhooks) for deployment on **Vercel** with MongoDB Atlas and OpenAI.

## Environment

Copy [.env.local.example](.env.local.example) to `.env.local` and fill in values. Server routes need `MONGODB_URI`, `OPENAI_API_KEY`, `JWT_SECRET`, and `WEBHOOK_HMAC_SECRET` at minimum.

- **Same-origin (recommended):** leave `NEXT_PUBLIC_API_URL` unset. The browser calls `/api/...` on the same host as the UI (local `next dev` or Vercel).
- **Split dev:** set `NEXT_PUBLIC_API_URL=http://localhost:4000` only if the UI should talk to a separate API process.

### Vercel

Add the same variables in the project **Settings → Environment Variables**. Use **Node.js** runtime (default for App Router API routes). Intake and webhook routes set `maxDuration` to 60s; on **Hobby**, confirm your plan’s function limit or upgrade if OpenAI calls time out.

After deploy, run seed once (locally against the same Atlas DB, or add a one-off job):

```bash
npm run seed-users
```

Defaults if seed env vars are omitted: `admin@veloce.local` / `admin123` and `reviewer@veloce.local` / `reviewer123`.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). **Dashboard** requires sign-in. Public **Submit brief** works without login.

Health check: `GET /api/health` (also `GET /health` via rewrite in [vercel.json](vercel.json)).

## Assessment

Product scope aligns with the [CodeAcme assessment](https://assessment.codeacme.com/).
