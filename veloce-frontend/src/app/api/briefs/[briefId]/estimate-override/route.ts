import { ObjectId } from "mongodb";

import { jsonDetail } from "@/lib/server/api-response";
import type { BriefDoc, EstimateOverrideDoc } from "@/lib/server/brief-docs";
import { ensureCanView } from "@/lib/server/brief-pipeline";
import { COLLECTIONS } from "@/lib/server/collections";
import { getEnv } from "@/lib/server/env";
import { getDb } from "@/lib/server/mongo";
import { getCurrentUser } from "@/lib/server/request-user";
import { estimateOverrideCreateSchema } from "@/lib/server/schemas";
import { overrideToOut } from "@/lib/server/serialize";

export const runtime = "nodejs";

type Params = { briefId: string };

export async function POST(
  request: Request,
  context: { params: Promise<Params> },
) {
  getEnv();
  const user = await getCurrentUser(request);
  if (!user) {
    return jsonDetail("Missing or invalid Authorization header", 401);
  }

  const { briefId } = await context.params;
  let oid: ObjectId;
  try {
    oid = new ObjectId(briefId);
  } catch {
    return jsonDetail("Not found", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonDetail("Invalid JSON", 400);
  }

  const parsed = estimateOverrideCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonDetail(parsed.error.issues, 422);
  }

  const db = await getDb();
  const brief = await db
    .collection<BriefDoc>(COLLECTIONS.briefs)
    .findOne({ _id: oid });
  if (!brief) {
    return jsonDetail("Not found", 404);
  }

  if (!(await ensureCanView(db, user, brief))) {
    return jsonDetail("Forbidden", 403);
  }

  const existing = await db
    .collection<EstimateOverrideDoc>(COLLECTIONS.estimateOverrides)
    .findOne({ brief_id: oid });

  const now = new Date();
  if (existing) {
    await db.collection(COLLECTIONS.estimateOverrides).updateOne(
      { _id: existing._id },
      {
        $set: {
          min_hours: parsed.data.minHours,
          max_hours: parsed.data.maxHours,
          reason: parsed.data.reason,
          at: now,
          by_user_id: user._id.toHexString(),
          by_name: user.name,
        },
      },
    );
    const o = await db
      .collection<EstimateOverrideDoc>(COLLECTIONS.estimateOverrides)
      .findOne({ _id: existing._id });
    return Response.json(overrideToOut(o!));
  }

  const ins = await db.collection(COLLECTIONS.estimateOverrides).insertOne({
    brief_id: oid,
    min_hours: parsed.data.minHours,
    max_hours: parsed.data.maxHours,
    reason: parsed.data.reason,
    at: now,
    by_user_id: user._id.toHexString(),
    by_name: user.name,
  });

  const o = await db
    .collection<EstimateOverrideDoc>(COLLECTIONS.estimateOverrides)
    .findOne({ _id: ins.insertedId });
  return Response.json(overrideToOut(o!));
}
