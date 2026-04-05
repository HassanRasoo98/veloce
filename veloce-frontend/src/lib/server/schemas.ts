import { z } from "zod";

import {
  BUDGET_TIERS,
  PIPELINE_STAGES,
  PROJECT_CATEGORIES,
  TIMELINE_URGENCY,
} from "@/types/veloce";

const budgetTier = z.enum(BUDGET_TIERS);
const timelineUrgency = z.enum(TIMELINE_URGENCY);
const pipelineStage = z.enum(PIPELINE_STAGES);

export const loginRequestSchema = z.object({
  email: z.string().min(1).max(320).transform((s) => s.trim().toLowerCase()),
  password: z.string(),
});

export const intakeCreateSchema = z
  .object({
    title: z.string().trim().min(3),
    descriptionRich: z.string().trim().min(20),
    budgetTier: budgetTier,
    timelineUrgency: timelineUrgency,
    contactName: z.string().trim().min(2),
    contactEmail: z.string().trim().min(1),
    contactPhone: z.union([z.string(), z.null()]).optional(),
  })
  .transform((v) => ({
    ...v,
    contactPhone:
      v.contactPhone === "" || v.contactPhone === undefined
        ? null
        : v.contactPhone,
  }));

export const stagePatchSchema = z.object({
  toStage: pipelineStage,
});

export const noteCreateSchema = z.object({
  parentId: z.string().nullable().optional(),
  body: z.string().trim().min(1),
});

export const estimateOverrideCreateSchema = z
  .object({
    minHours: z.number().int().positive(),
    maxHours: z.number().int().positive(),
    reason: z.string().trim().min(3),
  })
  .refine((v) => v.maxHours >= v.minHours, {
    message: "maxHours must be >= minHours",
  });

export const assignCreateSchema = z.object({
  assignedToUserId: z.string().min(1),
});

export const parsedAnalysisSchema = z
  .object({
    features: z.array(z.string()).min(1),
    category: z.enum(PROJECT_CATEGORIES),
    effort_hours_min: z.number().int().positive(),
    effort_hours_max: z.number().int().positive(),
    tech_stack: z.array(z.string()).min(1),
    complexity: z.preprocess(
      (v) => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : v),
      z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
      ]),
    ),
  })
  .refine((v) => v.effort_hours_max >= v.effort_hours_min, {
    message: "effort_hours_max must be >= effort_hours_min",
  });

export type IntakeCreateInput = z.infer<typeof intakeCreateSchema>;
