import { ObjectId } from "mongodb";

import { jsonDetail } from "@/lib/server/api-response";
import type {
  AiAnalysisDoc,
  AssignmentDoc,
  BriefDoc,
  EstimateOverrideDoc,
  NoteDoc,
  StageEventDoc,
} from "@/lib/server/brief-docs";
import { ensureCanView } from "@/lib/server/brief-pipeline";
import { COLLECTIONS } from "@/lib/server/collections";
import { getEnv } from "@/lib/server/env";
import { getDb } from "@/lib/server/mongo";
import { getCurrentUser } from "@/lib/server/request-user";
import {
  analysisToOut,
  assignmentToOut,
  briefToOut,
  noteToOut,
  overrideToOut,
  stageEventToOut,
} from "@/lib/server/serialize";

export const runtime = "nodejs";

type Params = { briefId: string };

export async function GET(
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

  const [analysis, events, notes, assigns, override] = await Promise.all([
    db
      .collection<AiAnalysisDoc>(COLLECTIONS.aiAnalyses)
      .findOne({ brief_id: oid }),
    db
      .collection<StageEventDoc>(COLLECTIONS.stageEvents)
      .find({ brief_id: oid })
      .sort({ at: -1 })
      .toArray(),
    db
      .collection<NoteDoc>(COLLECTIONS.notes)
      .find({ brief_id: oid })
      .sort({ at: -1 })
      .toArray(),
    db
      .collection<AssignmentDoc>(COLLECTIONS.assignments)
      .find({ brief_id: oid })
      .sort({ at: -1 })
      .toArray(),
    db
      .collection<EstimateOverrideDoc>(COLLECTIONS.estimateOverrides)
      .findOne({ brief_id: oid }),
  ]);

  return Response.json({
    brief: briefToOut(brief),
    analysis: analysis ? analysisToOut(analysis) : null,
    analysisError: null,
    stageEvents: events.map(stageEventToOut),
    notes: notes.map(noteToOut),
    assignments: assigns.map(assignmentToOut),
    estimateOverride: override ? overrideToOut(override) : null,
  });
}
