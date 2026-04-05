import { ObjectId } from "mongodb";

import { jsonDetail } from "@/lib/server/api-response";
import type { BriefDoc, NoteDoc } from "@/lib/server/brief-docs";
import { ensureCanView } from "@/lib/server/brief-pipeline";
import { COLLECTIONS } from "@/lib/server/collections";
import { getEnv } from "@/lib/server/env";
import { getDb } from "@/lib/server/mongo";
import { getCurrentUser } from "@/lib/server/request-user";
import { noteCreateSchema } from "@/lib/server/schemas";
import { noteToOut } from "@/lib/server/serialize";

export const runtime = "nodejs";

type RouteParams = { briefId: string };

export async function POST(
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

  const parsed = noteCreateSchema.safeParse(body);
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

  const parentId = parsed.data.parentId ?? null;
  if (parentId) {
    let pid: ObjectId;
    try {
      pid = new ObjectId(parentId);
    } catch {
      return jsonDetail("Invalid parentId", 400);
    }
    const parent = await db
      .collection<NoteDoc>(COLLECTIONS.notes)
      .findOne({ _id: pid });
    if (!parent || !parent.brief_id.equals(oid)) {
      return jsonDetail("Invalid parent note", 400);
    }
  }

  const doc: Omit<NoteDoc, "_id"> = {
    brief_id: oid,
    parent_id: parentId,
    author_user_id: user._id.toHexString(),
    author_name: user.name,
    body: parsed.data.body,
    at: new Date(),
  };

  const ins = await db.collection(COLLECTIONS.notes).insertOne(doc);
  const n = await db
    .collection<NoteDoc>(COLLECTIONS.notes)
    .findOne({ _id: ins.insertedId });
  if (!n) {
    return jsonDetail("Failed to create note", 500);
  }

  return Response.json(noteToOut(n));
}
