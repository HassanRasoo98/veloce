import type {
  AiAnalysisDoc,
  AssignmentDoc,
  BriefDoc,
  EstimateOverrideDoc,
  NoteDoc,
  StageEventDoc,
} from "./brief-docs";
import { isoZ } from "./timefmt";

export function briefToOut(b: BriefDoc) {
  return {
    id: b._id.toHexString(),
    title: b.title,
    descriptionRich: b.description_rich,
    budgetTier: b.budget_tier,
    timelineUrgency: b.timeline_urgency,
    contactName: b.contact_name,
    contactEmail: b.contact_email,
    contactPhone: b.contact_phone ?? undefined,
    stage: b.stage,
    submittedAt: isoZ(
      b.submitted_at instanceof Date ? b.submitted_at : new Date(b.submitted_at),
    ),
  };
}

export function analysisToOut(a: AiAnalysisDoc) {
  return {
    briefId: a.brief_id.toHexString(),
    features: a.features,
    category: a.category,
    effortHoursMin: a.effort_hours_min,
    effortHoursMax: a.effort_hours_max,
    techStack: a.tech_stack,
    complexity: a.complexity,
  };
}

export function stageEventToOut(e: StageEventDoc) {
  return {
    id: e._id.toHexString(),
    briefId: e.brief_id.toHexString(),
    fromStage: e.from_stage,
    toStage: e.to_stage,
    at: isoZ(e.at instanceof Date ? e.at : new Date(e.at)),
    actorName: e.actor_name,
  };
}

export function noteToOut(n: NoteDoc) {
  return {
    id: n._id.toHexString(),
    briefId: n.brief_id.toHexString(),
    parentId: n.parent_id,
    authorName: n.author_name,
    body: n.body,
    at: isoZ(n.at instanceof Date ? n.at : new Date(n.at)),
  };
}

export function assignmentToOut(a: AssignmentDoc) {
  return {
    id: a._id.toHexString(),
    briefId: a.brief_id.toHexString(),
    assignedToId: a.assigned_to_id,
    assignedToName: a.assigned_to_name,
    assignedByName: a.assigned_by_name,
    at: isoZ(a.at instanceof Date ? a.at : new Date(a.at)),
  };
}

export function overrideToOut(o: EstimateOverrideDoc) {
  return {
    briefId: o.brief_id.toHexString(),
    minHours: o.min_hours,
    maxHours: o.max_hours,
    reason: o.reason,
    at: isoZ(o.at instanceof Date ? o.at : new Date(o.at)),
    byName: o.by_name,
  };
}
