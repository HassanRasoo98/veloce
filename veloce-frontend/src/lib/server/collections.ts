/** Collection names must match Beanie `Settings.name` in the former Python backend. */
export const COLLECTIONS = {
  users: "users",
  briefs: "briefs",
  aiAnalyses: "aianalyses",
  stageEvents: "stageevents",
  notes: "notes",
  assignments: "assignments",
  estimateOverrides: "estimateoverrides",
  idempotencyKeys: "idempotencykeys",
} as const;
