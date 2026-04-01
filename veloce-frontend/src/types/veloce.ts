import { z } from "zod";

export const PIPELINE_STAGES = [
  "new",
  "under_review",
  "proposal_sent",
  "won",
  "archived",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PROJECT_CATEGORIES = [
  "Web App",
  "Mobile",
  "AI/ML",
  "Automation",
  "Integration",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const BUDGET_TIERS = [
  "under_10k",
  "10k_25k",
  "25k_50k",
  "50k_100k",
  "100k_plus",
] as const;

export type BudgetTier = (typeof BUDGET_TIERS)[number];

export const TIMELINE_URGENCY = [
  "flexible",
  "standard",
  "urgent",
  "critical",
] as const;

export type TimelineUrgency = (typeof TIMELINE_URGENCY)[number];

export type Role = "admin" | "reviewer";

export interface Brief {
  id: string;
  title: string;
  descriptionRich: string;
  budgetTier: BudgetTier;
  timelineUrgency: TimelineUrgency;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  stage: PipelineStage;
  submittedAt: string;
}

export interface AiAnalysis {
  briefId: string;
  features: string[];
  category: ProjectCategory;
  effortHoursMin: number;
  effortHoursMax: number;
  techStack: string[];
  complexity: 1 | 2 | 3 | 4 | 5;
}

export interface StageEvent {
  id: string;
  briefId: string;
  fromStage: PipelineStage | null;
  toStage: PipelineStage;
  at: string;
  actorName: string;
}

export interface Note {
  id: string;
  briefId: string;
  parentId: string | null;
  authorName: string;
  body: string;
  at: string;
}

export interface Assignment {
  id: string;
  briefId: string;
  assignedToId: string;
  assignedToName: string;
  assignedByName: string;
  at: string;
}

export interface EstimateOverride {
  briefId: string;
  minHours: number;
  maxHours: number;
  reason: string;
  at: string;
  byName: string;
}

export const intakeFormSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  descriptionRich: z
    .string()
    .trim()
    .min(20, "Please describe the project in at least 20 characters"),
  budgetTier: z.enum(BUDGET_TIERS),
  timelineUrgency: z.enum(TIMELINE_URGENCY),
  contactName: z.string().trim().min(2, "Name is required"),
  contactEmail: z.string().trim().email("Valid email required"),
  contactPhone: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.string().trim().max(40).optional(),
  ),
});

export type IntakeFormValues = z.infer<typeof intakeFormSchema>;

export function budgetTierLabel(tier: BudgetTier): string {
  const labels: Record<BudgetTier, string> = {
    under_10k: "Under $10k",
    "10k_25k": "$10k – $25k",
    "25k_50k": "$25k – $50k",
    "50k_100k": "$50k – $100k",
    "100k_plus": "$100k+",
  };
  return labels[tier];
}

/** Midpoint estimate for pipeline revenue KPIs */
export function budgetTierMidUsd(tier: BudgetTier): number {
  const map: Record<BudgetTier, number> = {
    under_10k: 5000,
    "10k_25k": 17500,
    "25k_50k": 37500,
    "50k_100k": 75000,
    "100k_plus": 125000,
  };
  return map[tier];
}

export function stageLabel(stage: PipelineStage): string {
  const labels: Record<PipelineStage, string> = {
    new: "New",
    under_review: "Under Review",
    proposal_sent: "Proposal Sent",
    won: "Won",
    archived: "Archived",
  };
  return labels[stage];
}
