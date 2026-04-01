# Veloce — mock frontend

UI-only implementation of the [CodeAcme Full-Stack AI Engineer assessment](https://assessment.codeacme.com/) product **Veloce** (project intake, AI-style analysis, internal pipeline). **There is no backend:** all briefs, analyses, notes, and stage events live in a React context seeded from [`src/lib/mock-data/`](src/lib/mock-data/index.ts).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Mock roles

Use **Mock role** on the dashboard to switch:

- **Admin** — sees every brief, can move cards on the Kanban, assign briefs to the reviewer, and open any detail view.
- **Reviewer** — only sees briefs that are assigned to the mock reviewer user (seed data plus any assignments you add as Admin).

This replaces real email/password auth for the purpose of the static demo.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Landing |
| `/intake` | Public-style intake form (validates with Zod; new briefs get a mock AI analysis) |
| `/dashboard/pipeline` | Kanban (drag-and-drop) |
| `/dashboard/briefs` | Table of briefs |
| `/dashboard/briefs/[id]` | Detail: submission + analysis, notes, timeline, estimate override |
| `/dashboard/analytics` | Recharts KPIs and charts |

Parent repo context: see [`../readme.md`](../readme.md).
