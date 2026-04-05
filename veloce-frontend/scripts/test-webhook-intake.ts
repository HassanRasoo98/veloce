/**
 * Exercise POST /api/webhooks/intake with HMAC-SHA256 (same as the route).
 *
 * Prereqs: dev server running (`npm run dev`), WEBHOOK_HMAC_SECRET in .env.local.
 *
 * Usage:
 *   npm run test-webhook
 *   npm run test-webhook -- --url https://your-app.vercel.app
 *   npm run test-webhook -- --payload scripts/fixtures/webhook-intake-payload.json
 *   npm run test-webhook -- --invalid-signature   # expect 401
 *   npm run test-webhook -- --dry-run             # print signature only
 */
import { createHmac } from "crypto";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const DEFAULT_PAYLOAD = {
  title: "Webhook test brief",
  descriptionRich:
    "Test submission from test-webhook-intake.ts; at least twenty characters.",
  budgetTier: "10k_25k" as const,
  timelineUrgency: "standard" as const,
  contactName: "Script Test",
  contactEmail: "webhook-test@example.com",
  contactPhone: null as null,
};

function parseArgs() {
  const args = process.argv.slice(2);
  let baseUrl = process.env.WEBHOOK_TEST_BASE_URL ?? "http://localhost:3000";
  let payloadPath: string | null = null;
  let invalidSig = false;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--url" && args[i + 1]) {
      baseUrl = args[++i]!;
      continue;
    }
    if (a === "--payload" && args[i + 1]) {
      payloadPath = args[++i]!;
      continue;
    }
    if (a === "--invalid-signature") {
      invalidSig = true;
      continue;
    }
    if (a === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (a === "--help" || a === "-h") {
      console.log(`Usage: npm run test-webhook -- [options]

Options:
  --url <base>              Origin only, default WEBHOOK_TEST_BASE_URL or http://localhost:3000
  --payload <file.json>     Raw body bytes (must match intakeCreateSchema)
  --invalid-signature       Send wrong HMAC; expect 401
  --dry-run                 Print sha256=... and exit (no HTTP)
`);
      process.exit(0);
    }
  }

  return { baseUrl, payloadPath, invalidSig, dryRun };
}

function signBody(secret: string, raw: Buffer): string {
  const digest = createHmac("sha256", secret).update(raw).digest("hex");
  return `sha256=${digest}`;
}

async function main() {
  const secret = process.env.WEBHOOK_HMAC_SECRET;
  if (!secret) {
    console.error("Missing WEBHOOK_HMAC_SECRET (set in .env.local)");
    process.exit(1);
  }

  const { baseUrl, payloadPath, invalidSig, dryRun } = parseArgs();

  const raw = payloadPath
    ? readFileSync(resolve(process.cwd(), payloadPath))
    : Buffer.from(JSON.stringify(DEFAULT_PAYLOAD), "utf8");

  const sig = invalidSig ? "sha256=deadbeef00000000" : signBody(secret, raw);

  const endpoint = new URL(
    "/api/webhooks/intake",
    baseUrl.replace(/\/$/, "") + "/",
  ).href;

  if (dryRun) {
    console.log("Body bytes:", raw.length);
    console.log("X-Signature:", sig);
    console.log("\nExample:\n");
    console.log(
      `curl -sS -X POST '${endpoint}' \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-Signature: ${sig}' \\\n  --data-binary @${payloadPath ?? "(inline — use saved file for curl)"}`,
    );
    if (!payloadPath) {
      console.log(
        "\nTip: save DEFAULT payload to a file and pass --payload for copy-paste curl.",
      );
    }
    return;
  }

  console.log(`POST ${endpoint}`);
  console.log(`Body: ${raw.length} bytes${payloadPath ? ` (${payloadPath})` : " (built-in default)"}`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Signature": sig,
    },
    body: raw,
  });

  const text = await res.text();
  console.log(`Status: ${res.status} ${res.statusText}`);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text.slice(0, 2000));
  }

  if (invalidSig) {
    if (res.status !== 401) {
      console.error("Expected 401 for --invalid-signature");
      process.exit(1);
    }
    console.log("\nOK: invalid signature rejected.");
    return;
  }

  if (!res.ok) {
    process.exit(1);
  }

  console.log("\nOK: webhook accepted. Check dashboard pipeline for the new brief.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
