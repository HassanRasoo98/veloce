import type { ObjectId } from "mongodb";

import { jsonDetail } from "@/lib/server/api-response";
import type { BriefDoc } from "@/lib/server/brief-docs";
import {
  briefCreateResponse,
  createBriefFromIntake,
  reviewerBriefIds,
} from "@/lib/server/brief-pipeline";
import { COLLECTIONS } from "@/lib/server/collections";
import { decodeCursor, encodeCursor } from "@/lib/server/cursor";
import { getEnv } from "@/lib/server/env";
import { getDb } from "@/lib/server/mongo";
import { getCurrentUser } from "@/lib/server/request-user";
import { intakeCreateSchema } from "@/lib/server/schemas";
import { briefToOut } from "@/lib/server/serialize";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  getEnv();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonDetail("Invalid JSON", 400);
  }

  const parsed = intakeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonDetail(parsed.error.issues, 422);
  }

  const db = await getDb();
  const { brief, analysis, analysisError } = await createBriefFromIntake(
    db,
    parsed.data,
    "Public intake",
  );

  return Response.json(briefCreateResponse(brief, analysis, analysisError));
}

export async function GET(request: Request) {
  getEnv();
  const user = await getCurrentUser(request);
  if (!user) {
    return jsonDetail("Missing or invalid Authorization header", 401);
  }

  const url = new URL(request.url);
  const cursorParam = url.searchParams.get("cursor");
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(
    100,
    Math.max(1, limitRaw ? parseInt(limitRaw, 10) || 20 : 20),
  );

  const db = await getDb();
  const ands: Record<string, unknown>[] = [];

  if (user.role === "reviewer") {
    const ids = await reviewerBriefIds(db, user._id.toHexString());
    if (ids.length === 0) {
      return Response.json({ items: [], nextCursor: null });
    }
    ands.push({ _id: { $in: ids } });
  }

  if (cursorParam) {
    let t: Date;
    let oid: ObjectId;
    try {
      const d = decodeCursor(cursorParam);
      t = d.t;
      oid = d.id;
    } catch {
      return jsonDetail("Invalid cursor", 400);
    }
    ands.push({
      $or: [
        { submitted_at: { $lt: t } },
        { $and: [{ submitted_at: t }, { _id: { $lt: oid } }] },
      ],
    });
  }

  let match: Record<string, unknown> = {};
  if (ands.length > 1) {
    match = { $and: ands };
  } else if (ands.length === 1) {
    match = ands[0] as Record<string, unknown>;
  }

  const coll = db.collection<BriefDoc>(COLLECTIONS.briefs);
  const q = Object.keys(match).length > 0 ? coll.find(match) : coll.find({});

  const rows = await q
    .sort({ submitted_at: -1, _id: -1 })
    .limit(limit + 1)
    .toArray();

  let nextCursor: string | null = null;
  let items = rows;
  if (rows.length > limit) {
    items = rows.slice(0, limit);
    const last = items[items.length - 1];
    if (last) {
      const sa =
        last.submitted_at instanceof Date
          ? last.submitted_at
          : new Date(last.submitted_at);
      nextCursor = encodeCursor(sa, last._id);
    }
  }

  return Response.json({
    items: items.map((b) => briefToOut(b)),
    nextCursor,
  });
}
