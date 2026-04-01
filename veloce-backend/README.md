# Veloce API (FastAPI)

REST backend for the Veloce assessment app: **MongoDB** (Beanie/Motor), **OpenAI** structured brief analysis, **JWT** auth, and **HMAC** webhook intake.

## Environment

Copy [.env.example](.env.example) to `.env` and fill values. Required:

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string (include auth; database can be set via `MONGODB_DB`) |
| `MONGODB_DB` | Database name (default `veloce`) |
| `OPENAI_API_KEY` | OpenAI API key |
| `JWT_SECRET` | Long random string for signing JWTs |
| `WEBHOOK_HMAC_SECRET` | Shared secret for `POST /api/webhooks/intake` |
| `CORS_ORIGIN` | Frontend origin, e.g. `http://localhost:3000` |

Optional: `OPENAI_MODEL` (default `gpt-4o-mini`), `PORT` (default `4000`).

## Run

```bash
cd veloce-backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Seed admin and reviewer users (passwords from env or defaults in [scripts/seed_users.py](scripts/seed_users.py)):

```bash
PYTHONPATH=. python scripts/seed_users.py
```

Start the server:

```bash
uvicorn main:app --reload --port 4000
```

Equivalent:

```bash
python main.py
```

(From `veloce-backend/`; ensure the venv is activated.)

<details>
<summary>Alternative (same app object)</summary>

```bash
uvicorn app.main:app --reload --port 4000
```

</details>

Open interactive docs: [http://localhost:4000/docs](http://localhost:4000/docs).

## Webhook signing

`POST /api/webhooks/intake` expects header:

`X-Signature: sha256=<hex>`

where `<hex>` is the lowercase HMAC-SHA256 of the **raw request body** using `WEBHOOK_HMAC_SECRET`.

Example (save JSON to `body.json` first):

```bash
BODY=$(cat body.json)
SIG="sha256=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_HMAC_SECRET" | awk '{print $2}')"
curl -sS -X POST http://localhost:4000/api/webhooks/intake \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIG" \
  -d "$BODY"
```

## API overview

- `POST /api/briefs` — public intake (same JSON as the frontend form)
- `POST /api/auth/login`, `GET /api/auth/me` — JWT (`Authorization: Bearer …`)
- `GET /api/briefs` — cursor pagination; reviewers only see assigned briefs
- `GET /api/briefs/{id}` — full detail (403 if reviewer and not assigned)
- `PATCH /api/briefs/{id}/stage`, `POST .../notes`, `POST .../estimate-override`, `POST .../assign` (admin)
- `GET /api/users?role=reviewer` — list reviewers (authenticated)

Rotate any API keys or DB passwords that may have been exposed in chat or commits.
