import { ObjectId } from "mongodb";

import { jsonDetail } from "@/lib/server/api-response";
import type { BriefDoc, StageEventDoc } from "@/lib/server/brief-docs";
import { ensureCanView } from "@/lib/server/brief-pipeline";
import { COLLECTIONS } from "@/lib/server/collections";
import { getEnv } from "@/lib/server/env";
import { getDb } from "@/lib/server/mongo";
import { getCurrentUser } from "@/lib/server/request-user";
import { stagePatchSchema } from "@/lib/server/schemas";
import { briefToOut } from "@/lib/server/serialize";

export const runtime = "nodejs";

type RouteParams = { briefId: string };

export async function PATCH(
  request: Request,
  ctx: { params: Promise<RouteParams> },
) {
  getEnv();
  const user = await getCurrentUser(request);
  if (!user) {
    return jsonDetail("Missing or invalid Authorization header", 401);
  }

  const { briefId } = await ctx.params;
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

  const parsed = stagePatchSchema.safeParse(body);
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

  if (brief.stage === parsed.data.toStage) {
    return Response.json({ ok: true, brief: briefToOut(brief) });
  }

  const fromStage = brief.stage;
  await db.collection(COLLECTIONS.briefs).updateOne(
    { _id: oid },
    { $set: { stage: parsed.data.toStage } },
  );

  const updated = await db
    .collection<BriefDoc>(COLLECTIONS.briefs)
    .findOne({ _id: oid });
  if (!updated) {
    return jsonDetail("Not found", 404);
  }

  const ev: Omit<StageEventDoc, "_id"> = {
    brief_id: oid,
    from_stage: fromStage,
    to_stage: parsed.data.toStage,
    at: new Date(),
    actor_user_id: user._id.toHexString(),
    actor_name: user.name,
  };
  await db.collection(COLLECTIONS.stageEvents).insertOne(ev);

  return Response.json({ ok: true, brief: briefToOut(updated) });
}
