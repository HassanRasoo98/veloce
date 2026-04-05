import type { Db, ObjectId } from "mongodb";

import type { AiAnalysisDoc, BriefDoc } from "./brief-docs";
import { COLLECTIONS } from "./collections";
import { analyzeBrief } from "./openai-analyze";
import { analysisToOut, briefToOut } from "./serialize";
import type { IntakeCreateInput } from "./schemas";

export async function reviewerBriefIds(
  db: Db,
  userId: string,
): Promise<ObjectId[]> {
  const assigns = await db
    .collection(COLLECTIONS.assignments)
    .find({ assigned_to_id: userId })
    .toArray();
  const seen = new Set<string>();
  const out: ObjectId[] = [];
  for (const a of assigns) {
    const bid = a.brief_id as ObjectId;
    const hex = bid.toHexString();
    if (!seen.has(hex)) {
      seen.add(hex);
      out.push(bid);
    }
  }
  return out;
}

export async function createBriefFromIntake(
  db: Db,
  data: IntakeCreateInput,
  actorLabel: string,
): Promise<{
  brief: BriefDoc;
  analysis: AiAnalysisDoc | null;
  analysisError: string | null;
}> {
  const now = new Date();

  const briefInsert = {
    title: data.title,
    description_rich: data.descriptionRich,
    budget_tier: data.budgetTier,
    timeline_urgency: data.timelineUrgency,
    contact_name: data.contactName,
    contact_email: data.contactEmail,
    contact_phone: data.contactPhone,
    stage: "new" as const,
    submitted_at: now,
  };

  const br = await db.collection(COLLECTIONS.briefs).insertOne(briefInsert);
  const briefId = br.insertedId;
  const brief = (await db
    .collection<BriefDoc>(COLLECTIONS.briefs)
    .findOne({ _id: briefId }))!;

  const { parsed, error: analyzeErr } = await analyzeBrief({
    title: data.title,
    descriptionRich: data.descriptionRich,
    budgetTier: data.budgetTier,
    timelineUrgency: data.timelineUrgency,
  });

  let analysis: AiAnalysisDoc | null = null;
  let analysisError: string | null = analyzeErr;
  if (parsed) {
    const aiInsert = {
      brief_id: briefId,
      features: parsed.features,
      category: parsed.category,
      effort_hours_min: parsed.effort_hours_min,
      effort_hours_max: parsed.effort_hours_max,
      tech_stack: parsed.tech_stack,
      complexity: parsed.complexity,
    };
    const aiRes = await db
      .collection(COLLECTIONS.aiAnalyses)
      .insertOne(aiInsert);
    analysis = (await db
      .collection<AiAnalysisDoc>(COLLECTIONS.aiAnalyses)
      .findOne({ _id: aiRes.insertedId }))!;
    analysisError = null;
  }

  const evInsert = {
    brief_id: briefId,
    from_stage: null,
    to_stage: "new" as const,
    at: now,
    actor_user_id: null,
    actor_name: actorLabel,
  };
  await db.collection(COLLECTIONS.stageEvents).insertOne(evInsert);

  return { brief, analysis, analysisError };
}

export function briefCreateResponse(
  brief: BriefDoc,
  analysis: AiAnalysisDoc | null,
  analysisError: string | null,
) {
  return {
    brief: briefToOut(brief),
    analysis: analysis ? analysisToOut(analysis) : null,
    analysisError,
  };
}

/** Replay payload for idempotent intake/webhook retries (analysisError not stored; omitted on replay). */
export async function loadBriefCreateResponse(
  db: Db,
  briefId: ObjectId,
): Promise<ReturnType<typeof briefCreateResponse> | null> {
  const brief = await db
    .collection<BriefDoc>(COLLECTIONS.briefs)
    .findOne({ _id: briefId });
  if (!brief) return null;
  const analysis = await db
    .collection<AiAnalysisDoc>(COLLECTIONS.aiAnalyses)
    .findOne({ brief_id: briefId });
  return briefCreateResponse(brief, analysis ?? null, null);
}

export async function ensureCanView(
  db: Db,
  user: { role: string; _id: ObjectId },
  brief: BriefDoc,
): Promise<boolean> {
  if (user.role === "admin") return true;
  const ids = await reviewerBriefIds(db, user._id.toHexString());
  return ids.some((id) => id.equals(brief._id));
}
