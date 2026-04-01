# Veloce frontend (Next.js)

Next.js App Router UI for **Veloce**: public intake, dashboard pipeline (Kanban), brief detail, and analytics. Data comes from the **FastAPI** backend ([../veloce-backend/README.md](../veloce-backend/README.md)), not from in-memory mocks.

## Environment

Copy [.env.local.example](.env.local.example) to `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Dashboard** after signing in (seed users from the backend README; defaults `admin@veloce.local` / `admin123` and `reviewer@veloce.local` / `reviewer123` if you used the seed script defaults).

Public **Submit brief** works without login; the API stores the brief and runs OpenAI analysis.

## Assessment

Product scope aligns with the [CodeAcme assessment](https://assessment.codeacme.com/). Parent repo: [../readme.md](../readme.md).
