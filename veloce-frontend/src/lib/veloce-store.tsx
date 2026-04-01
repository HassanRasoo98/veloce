"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  buildAnalysisMap,
  seedAnalyses,
  seedAssignments,
  seedBriefs,
  seedNotes,
  seedStageEvents,
} from "@/lib/mock-data";
import type {
  AiAnalysis,
  Assignment,
  Brief,
  EstimateOverride,
  IntakeFormValues,
  Note,
  PipelineStage,
  Role,
  StageEvent,
} from "@/types/veloce";
import {
  MOCK_USER_ADMIN,
  MOCK_USER_REVIEWER,
  PIPELINE_STAGES,
  type ProjectCategory,
} from "@/types/veloce";

type State = {
  briefs: Brief[];
  analyses: Map<string, AiAnalysis>;
  stageEvents: StageEvent[];
  notes: Note[];
  assignments: Assignment[];
  estimateOverrides: Map<string, EstimateOverride>;
  role: Role;
};

type Action =
  | { type: "SET_ROLE"; role: Role }
  | {
      type: "ADD_BRIEF";
      brief: Brief;
      analysis: AiAnalysis;
    }
  | {
      type: "MOVE_STAGE";
      briefId: string;
      toStage: PipelineStage;
      actorName: string;
    }
  | {
      type: "ADD_NOTE";
      note: Note;
    }
  | {
      type: "OVERRIDE_ESTIMATE";
      override: EstimateOverride;
    }
  | { type: "ADD_ASSIGNMENT"; assignment: Assignment };

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function mockAnalyze(briefId: string, values: IntakeFormValues): AiAnalysis {
  const text = `${values.title} ${values.descriptionRich}`.toLowerCase();
  let category: ProjectCategory = "Web App";
  if (/(mobile|ios|android|react native)/.test(text)) category = "Mobile";
  else if (/(ai|ml|rag|embedding|llm|gpt|model)/.test(text)) category = "AI/ML";
  else if (/(zapier|sync|salesforce|integration|api|webhook)/.test(text))
    category = "Integration";
  else if (/(automat|ocr|pipeline|cron|workflow|etl)/.test(text))
    category = "Automation";

  const complexity = (
    values.budgetTier === "100k_plus" || values.timelineUrgency === "critical"
      ? 5
      : values.budgetTier === "under_10k"
        ? 2
        : 3
  ) as 1 | 2 | 3 | 4 | 5;

  const base = 60 + values.descriptionRich.length / 4;

  return {
    briefId,
    features: [
      "Discovery workshop and roadmap",
      "Core user flows and data model",
      "Production deployment and handoff",
    ],
    category,
    effortHoursMin: Math.round(base * 0.8),
    effortHoursMax: Math.round(base * 1.6),
    techStack: ["Next.js", "PostgreSQL", "Tailwind CSS"],
    complexity,
  };
}

const initialState: State = {
  briefs: seedBriefs,
  analyses: buildAnalysisMap(seedAnalyses),
  stageEvents: seedStageEvents,
  notes: seedNotes,
  assignments: seedAssignments,
  estimateOverrides: new Map(),
  role: "admin",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ROLE":
      return { ...state, role: action.role };
    case "ADD_BRIEF":
      return {
        ...state,
        briefs: [action.brief, ...state.briefs],
        analyses: new Map(state.analyses).set(
          action.analysis.briefId,
          action.analysis,
        ),
        stageEvents: [
          {
            id: nextId("ev"),
            briefId: action.brief.id,
            fromStage: null,
            toStage: "new",
            at: action.brief.submittedAt,
            actorName: "Public intake",
          },
          ...state.stageEvents,
        ],
      };
    case "MOVE_STAGE": {
      const { briefId, toStage, actorName } = action;
      const brief = state.briefs.find((b) => b.id === briefId);
      if (!brief || brief.stage === toStage) return state;
      const fromStage = brief.stage;
      const event: StageEvent = {
        id: nextId("ev"),
        briefId,
        fromStage,
        toStage,
        at: new Date().toISOString(),
        actorName,
      };
      return {
        ...state,
        briefs: state.briefs.map((b) =>
          b.id === briefId ? { ...b, stage: toStage } : b,
        ),
        stageEvents: [event, ...state.stageEvents],
      };
    }
    case "ADD_NOTE":
      return { ...state, notes: [action.note, ...state.notes] };
    case "OVERRIDE_ESTIMATE":
      return {
        ...state,
        estimateOverrides: new Map(state.estimateOverrides).set(
          action.override.briefId,
          action.override,
        ),
      };
    case "ADD_ASSIGNMENT":
      return {
        ...state,
        assignments: [action.assignment, ...state.assignments],
      };
    default:
      return state;
  }
}

type VeloceContextValue = {
  briefs: Brief[];
  analyses: Map<string, AiAnalysis>;
  stageEvents: StageEvent[];
  notes: Note[];
  assignments: Assignment[];
  estimateOverrides: Map<string, EstimateOverride>;
  role: Role;
  currentUserName: string;
  setRole: (role: Role) => void;
  addIntakeBrief: (values: IntakeFormValues) => void;
  moveBriefToStage: (briefId: string, toStage: PipelineStage) => void;
  addNote: (input: {
    briefId: string;
    parentId: string | null;
    body: string;
  }) => void;
  overrideEstimate: (input: {
    briefId: string;
    minHours: number;
    maxHours: number;
    reason: string;
  }) => void;
  assignToReviewer: (briefId: string) => void;
  isReviewerAssignedTo: (briefId: string) => boolean;
  visibleBriefs: Brief[];
  PIPELINE_STAGES: typeof PIPELINE_STAGES;
};

const VeloceContext = createContext<VeloceContextValue | null>(null);

export function VeloceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const currentUserName =
    state.role === "admin"
      ? MOCK_USER_ADMIN.name
      : MOCK_USER_REVIEWER.name;

  const isReviewerAssignedTo = useCallback(
    (briefId: string) =>
      state.assignments.some(
        (a) =>
          a.briefId === briefId && a.assignedToId === MOCK_USER_REVIEWER.id,
      ),
    [state.assignments],
  );

  const visibleBriefs = useMemo(() => {
    if (state.role === "admin") return state.briefs;
    return state.briefs.filter((b) => isReviewerAssignedTo(b.id));
  }, [state.briefs, state.role, isReviewerAssignedTo]);

  const setRole = useCallback((role: Role) => {
    dispatch({ type: "SET_ROLE", role });
  }, []);

  const addIntakeBrief = useCallback((values: IntakeFormValues) => {
    const id = nextId("brf");
    const submittedAt = new Date().toISOString();
    const brief: Brief = {
      id,
      title: values.title,
      descriptionRich: values.descriptionRich,
      budgetTier: values.budgetTier,
      timelineUrgency: values.timelineUrgency,
      contactName: values.contactName,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone?.trim() || undefined,
      stage: "new",
      submittedAt,
    };
    const analysis = mockAnalyze(id, values);
    dispatch({ type: "ADD_BRIEF", brief, analysis });
  }, []);

  const moveBriefToStage = useCallback(
    (briefId: string, toStage: PipelineStage) => {
      dispatch({
        type: "MOVE_STAGE",
        briefId,
        toStage,
        actorName: currentUserName,
      });
    },
    [currentUserName],
  );

  const addNote = useCallback(
    (input: { briefId: string; parentId: string | null; body: string }) => {
      const note: Note = {
        id: nextId("note"),
        briefId: input.briefId,
        parentId: input.parentId,
        authorName: currentUserName,
        body: input.body.trim(),
        at: new Date().toISOString(),
      };
      dispatch({ type: "ADD_NOTE", note });
    },
    [currentUserName],
  );

  const overrideEstimate = useCallback(
    (input: {
      briefId: string;
      minHours: number;
      maxHours: number;
      reason: string;
    }) => {
      dispatch({
        type: "OVERRIDE_ESTIMATE",
        override: {
          briefId: input.briefId,
          minHours: input.minHours,
          maxHours: input.maxHours,
          reason: input.reason.trim(),
          at: new Date().toISOString(),
          byName: currentUserName,
        },
      });
    },
    [currentUserName],
  );

  const assignToReviewer = useCallback(
    (briefId: string) => {
      const assignment: Assignment = {
        id: nextId("asg"),
        briefId,
        assignedToId: MOCK_USER_REVIEWER.id,
        assignedToName: MOCK_USER_REVIEWER.name,
        assignedByName: MOCK_USER_ADMIN.name,
        at: new Date().toISOString(),
      };
      dispatch({ type: "ADD_ASSIGNMENT", assignment });
    },
    [],
  );

  const value = useMemo<VeloceContextValue>(
    () => ({
      briefs: state.briefs,
      analyses: state.analyses,
      stageEvents: state.stageEvents,
      notes: state.notes,
      assignments: state.assignments,
      estimateOverrides: state.estimateOverrides,
      role: state.role,
      currentUserName,
      setRole,
      addIntakeBrief,
      moveBriefToStage,
      addNote,
      overrideEstimate,
      assignToReviewer,
      isReviewerAssignedTo,
      visibleBriefs,
      PIPELINE_STAGES,
    }),
    [
      state.briefs,
      state.analyses,
      state.stageEvents,
      state.notes,
      state.assignments,
      state.estimateOverrides,
      state.role,
      currentUserName,
      setRole,
      addIntakeBrief,
      moveBriefToStage,
      addNote,
      overrideEstimate,
      assignToReviewer,
      isReviewerAssignedTo,
      visibleBriefs,
    ],
  );

  return (
    <VeloceContext.Provider value={value}>{children}</VeloceContext.Provider>
  );
}

export function useVeloce() {
  const ctx = useContext(VeloceContext);
  if (!ctx) throw new Error("useVeloce must be used within VeloceProvider");
  return ctx;
}
