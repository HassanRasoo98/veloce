import type { Db } from "mongodb";

import {
  PIPELINE_STAGES,
  budgetTierMidUsd,
  stageLabel,
  type BudgetTier,
  type PipelineStage,
} from "@/types/veloce";

import type { AiAnalysisDoc, BriefDoc } from "./brief-docs";
import { reviewerBriefIds } from "./brief-pipeline";
import { COLLECTIONS } from "./collections";
import type { UserDoc } from "./user-doc";

const ACTIVE_STAGES: PipelineStage[] = [
  "new",
  "under_review",
  "proposal_sent",
];

export type AnalyticsSummary = {
  byStage: { stage: string; count: number }[];
  conversion: { rate: number; won: number; total: number };
  pipelineRevenue: number;
  complexityOverTime: { month: string; avgComplexity: number }[];
  topCategories: { name: string; value: number }[];
};

function monthKey(submittedAt: Date): string {
  const d =
    submittedAt instanceof Date ? submittedAt : new Date(submittedAt);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function emptySummary(): AnalyticsSummary {
  return {
    byStage: PIPELINE_STAGES.map((stage) => ({
      stage: stageLabel(stage),
      count: 0,
    })),
    conversion: { rate: 0, won: 0, total: 0 },
    pipelineRevenue: 0,
    complexityOverTime: [],
    topCategories: [],
  };
}

/** Aggregates visible briefs the same way as the dashboard charts. */
export async function computeAnalyticsSummary(
  db: Db,
  user: UserDoc,
): Promise<AnalyticsSummary> {
  let briefFilter: Record<string, unknown> = {};
  if (user.role === "reviewer") {
    const bids = await reviewerBriefIds(db, user._id.toHexString());
    if (bids.length === 0) {
      return emptySummary();
    }
    briefFilter = { _id: { $in: bids } };
  }

  const briefs = await db
    .collection<BriefDoc>(COLLECTIONS.briefs)
    .find(briefFilter)
    .toArray();

  const ids = briefs.map((b) => b._id);
  const analyses =
    ids.length === 0
      ? []
      : await db
          .collection<AiAnalysisDoc>(COLLECTIONS.aiAnalyses)
          .find({ brief_id: { $in: ids } })
          .toArray();

  const analysisByBrief = new Map<string, AiAnalysisDoc>();
  for (const a of analyses) {
    analysisByBrief.set(a.brief_id.toHexString(), a);
  }

  const byStage = PIPELINE_STAGES.map((stage) => ({
    stage: stageLabel(stage),
    count: briefs.filter((b) => b.stage === stage).length,
  }));

  const total = briefs.length;
  const won = briefs.filter((b) => b.stage === "won").length;
  const conversion = {
    rate: total ? Math.round((won / total) * 1000) / 10 : 0,
    won,
    total,
  };

  const pipelineRevenue = briefs
    .filter((b) => ACTIVE_STAGES.includes(b.stage))
    .reduce(
      (sum, b) => sum + budgetTierMidUsd(b.budget_tier as BudgetTier),
      0,
    );

  const complexityMap = new Map<string, { sum: number; n: number }>();
  for (const b of briefs) {
    const a = analysisByBrief.get(b._id.toHexString());
    if (!a) continue;
    const sa =
      b.submitted_at instanceof Date
        ? b.submitted_at
        : new Date(b.submitted_at);
    const mk = monthKey(sa);
    const cur = complexityMap.get(mk) ?? { sum: 0, n: 0 };
    cur.sum += a.complexity;
    cur.n += 1;
    complexityMap.set(mk, cur);
  }
  const complexityOverTime = [...complexityMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { sum, n }]) => ({
      month,
      avgComplexity: Math.round((sum / n) * 10) / 10,
    }));

  const categoryCounts = new Map<string, number>();
  for (const b of briefs) {
    const a = analysisByBrief.get(b._id.toHexString());
    if (!a) continue;
    categoryCounts.set(
      a.category,
      (categoryCounts.get(a.category) ?? 0) + 1,
    );
  }
  const topCategories = [...categoryCounts.entries()]
    .sort((x, y) => y[1] - x[1])
    .map(([name, value]) => ({ name, value }));

  return {
    byStage,
    conversion,
    pipelineRevenue,
    complexityOverTime,
    topCategories,
  };
}
