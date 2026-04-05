import { createHmac, timingSafeEqual } from "crypto";

import { jsonDetail } from "@/lib/server/api-response";
import { bumpAnalyticsCacheGeneration } from "@/lib/server/analytics-cache";
import {
  briefCreateResponse,
  createBriefFromIntake,
  loadBriefCreateResponse,
} from "@/lib/server/brief-pipeline";
import { getEnv } from "@/lib/server/env";
import {
  finalizeIdempotencyKey,
  fullIdempotencyKey,
  normalizeIdempotencyHeader,
  releaseIdempotencyReservation,
  startIdempotentBriefCreate,
} from "@/lib/server/idempotency";
import { getDb } from "@/lib/server/mongo";
import { rateLimitPublicWrite } from "@/lib/server/rate-limit";
import { intakeCreateSchema } from "@/lib/server/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

function verifyHmac(rawBody: Buffer, headerVal: string, secret: string): boolean {
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = `sha256=${digest}`;
  const a = headerVal.trim();
  if (a.length !== expected.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const env = getEnv();
  const raw = Buffer.from(await request.arrayBuffer());
  const sig =
    request.headers.get("X-Signature") ??
    request.headers.get("x-signature") ??
    "";

  if (!verifyHmac(raw, sig, env.WEBHOOK_HMAC_SECRET)) {
    return jsonDetail("Invalid signature", 401);
  }

  const limited = await rateLimitPublicWrite(request, "webhook");
  if (limited) return limited;

  let data: unknown;
  try {
    data = JSON.parse(raw.toString("utf8"));
  } catch {
    return jsonDetail("Invalid JSON", 400);
  }

  const parsed = intakeCreateSchema.safeParse(data);
  if (!parsed.success) {
    return jsonDetail(parsed.error.issues, 422);
  }

  const db = await getDb();
  const rawIdem = normalizeIdempotencyHeader(request);
  let idemKey: string | null = null;

  if (rawIdem) {
    idemKey = fullIdempotencyKey("webhook", rawIdem);
    const start = await startIdempotentBriefCreate(db, idemKey);
    if (start.kind === "replay") {
      const replayed = await loadBriefCreateResponse(db, start.briefId);
      if (!replayed) {
        return jsonDetail("Not found", 404);
      }
      return Response.json(replayed);
    }
    if (start.kind === "in_flight") {
      return jsonDetail(
        "A request with this idempotency key is already in progress",
        409,
      );
    }
  }

  try {
    const { brief, analysis, analysisError } = await createBriefFromIntake(
      db,
      parsed.data,
      "Webhook",
    );

    if (idemKey) {
      await finalizeIdempotencyKey(db, idemKey, brief._id);
    }

    void bumpAnalyticsCacheGeneration();
    return Response.json(briefCreateResponse(brief, analysis, analysisError));
  } catch (e) {
    if (idemKey) {
      await releaseIdempotencyReservation(db, idemKey);
    }
    throw e;
  }
}
