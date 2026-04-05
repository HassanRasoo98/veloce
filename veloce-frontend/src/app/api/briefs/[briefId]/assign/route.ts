import { ObjectId } from "mongodb";

import { jsonDetail } from "@/lib/server/api-response";
import { bumpAnalyticsCacheGeneration } from "@/lib/server/analytics-cache";
import type { AssignmentDoc, BriefDoc } from "@/lib/server/brief-docs";
import { COLLECTIONS } from "@/lib/server/collections";
import { getEnv } from "@/lib/server/env";
import { getDb } from "@/lib/server/mongo";
import { getCurrentUser, requireAdmin } from "@/lib/server/request-user";
import { assignCreateSchema } from "@/lib/server/schemas";
import { assignmentToOut } from "@/lib/server/serialize";
import type { UserDoc } from "@/lib/server/user-doc";

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
  if (!requireAdmin(user)) {
    return jsonDetail("Admin only", 403);
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

  const parsed = assignCreateSchema.safeParse(body);
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

  let assigneeOid: ObjectId;
  try {
    assigneeOid = new ObjectId(parsed.data.assignedToUserId);
  } catch {
    return jsonDetail("Invalid user id", 400);
  }

  const assignee = await db
    .collection<UserDoc>(COLLECTIONS.users)
    .findOne({ _id: assigneeOid });
  if (!assignee || assignee.role !== "reviewer") {
    return jsonDetail("Target must be a reviewer", 400);
  }

  const doc: Omit<AssignmentDoc, "_id"> = {
    brief_id: oid,
    assigned_to_id: assignee._id.toHexString(),
    assigned_to_name: assignee.name,
    assigned_by_id: user._id.toHexString(),
    assigned_by_name: user.name,
    at: new Date(),
  };

  const ins = await db.collection(COLLECTIONS.assignments).insertOne(doc);
  const a = await db
    .collection<AssignmentDoc>(COLLECTIONS.assignments)
    .findOne({ _id: ins.insertedId });
  void bumpAnalyticsCacheGeneration();
  return Response.json(assignmentToOut(a!));
}
