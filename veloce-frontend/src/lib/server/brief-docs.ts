import type { ObjectId } from "mongodb";

import type { PipelineStage, ProjectCategory } from "@/types/veloce";

export type BriefDoc = {
  _id: ObjectId;
  title: string;
  description_rich: string;
  budget_tier: string;
  timeline_urgency: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string | null;
  stage: PipelineStage;
  submitted_at: Date;
};

export type AiAnalysisDoc = {
  _id: ObjectId;
  brief_id: ObjectId;
  features: string[];
  category: ProjectCategory;
  effort_hours_min: number;
  effort_hours_max: number;
  tech_stack: string[];
  complexity: 1 | 2 | 3 | 4 | 5;
};

export type StageEventDoc = {
  _id: ObjectId;
  brief_id: ObjectId;
  from_stage: PipelineStage | null;
  to_stage: PipelineStage;
  at: Date;
  actor_user_id?: string | null;
  actor_name: string;
};

export type NoteDoc = {
  _id: ObjectId;
  brief_id: ObjectId;
  parent_id: string | null;
  author_user_id: string;
  author_name: string;
  body: string;
  at: Date;
};

export type AssignmentDoc = {
  _id: ObjectId;
  brief_id: ObjectId;
  assigned_to_id: string;
  assigned_to_name: string;
  assigned_by_id: string;
  assigned_by_name: string;
  at: Date;
};

export type EstimateOverrideDoc = {
  _id: ObjectId;
  brief_id: ObjectId;
  min_hours: number;
  max_hours: number;
  reason: string;
  at: Date;
  by_user_id: string;
  by_name: string;
};
