# Veloce

AI-assisted project intake, brief analysis (OpenAI), and an internal dashboard (Kanban, analytics, role-based access) built with **Next.js** (App Router), **MongoDB Atlas**, and optional **Upstash Redis**.

| | |
| --- | --- |
| **Live app** | [https://veloce-rjbr8bqkp-hassan-rasools-projects.vercel.app](https://veloce-rjbr8bqkp-hassan-rasools-projects.vercel.app) |
| **Repository** | [https://github.com/HassanRasoo98/veloce](https://github.com/HassanRasoo98/veloce) |

The application code lives in **`veloce-frontend/`**. See [veloce-frontend/README.md](veloce-frontend/README.md) for environment variables, architecture, caching, AI pipeline, and AI-tool disclosure.

## Quick start (local)

```bash
cd veloce-frontend
cp .env.local.example .env.local
# Edit .env.local — see veloce-frontend/README.md for required variables

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Public **Submit brief** works without login; **Dashboard** requires sign-in.

After connecting MongoDB, run once against the same database:

```bash
npm run create-indexes
npm run seed-users
```

## Deploy on Vercel

1. In the Vercel project, set **Root Directory** to `veloce-frontend` (this is the folder that contains `package.json` and `next.config.ts`).
2. Leave **Framework Preset** as **Next.js** and do **not** set a custom **Output Directory** (Next.js on Vercel uses its own output; setting e.g. `dist` or `out` incorrectly often yields a **404** on every route).
3. Add the same environment variables as in `.env.local.example` under **Settings → Environment Variables**.
4. After deploy, run `create-indexes` and `seed-users` locally (or via a one-off script) pointed at production Atlas.
