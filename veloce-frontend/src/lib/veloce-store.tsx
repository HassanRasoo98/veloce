"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import {
  createBriefPublic,
  getBriefDetail,
  listBriefsPage,
  listUsers,
  patchBriefStage,
  postAssign,
  postEstimateOverride,
  postNote,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
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
import { PIPELINE_STAGES } from "@/types/veloce";

type State = {
  briefs: Brief[];
  analyses: Map<string, AiAnalysis>;
  stageEvents: StageEvent[];
  notes: Note[];
  assignments: Assignment[];
  estimateOverrides: Map<string, EstimateOverride>;
};

const emptyState: State = {
  briefs: [],
  analyses: new Map(),
  stageEvents: [],
  notes: [],
  assignments: [],
  estimateOverrides: new Map(),
};

type Action =
  | { type: "RESET" }
  | {
      type: "HYDRATE";
      briefs: Brief[];
      analyses: Map<string, AiAnalysis>;
      stageEvents: StageEvent[];
      notes: Note[];
      assignments: Assignment[];
      estimateOverrides: Map<string, EstimateOverride>;
    };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "RESET":
      return { ...emptyState };
    case "HYDRATE":
      return {
        briefs: action.briefs,
        analyses: action.analyses,
        stageEvents: action.stageEvents,
        notes: action.notes,
        assignments: action.assignments,
        estimateOverrides: action.estimateOverrides,
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
  userId: string;
  syncing: boolean;
  defaultReviewerId: string | null;
  refreshWorkspace: () => Promise<void>;
  addIntakeBrief: (values: IntakeFormValues) => Promise<void>;
  moveBriefToStage: (briefId: string, toStage: PipelineStage) => Promise<void>;
  addNote: (input: {
    briefId: string;
    parentId: string | null;
    body: string;
  }) => Promise<void>;
  overrideEstimate: (input: {
    briefId: string;
    minHours: number;
    maxHours: number;
    reason: string;
  }) => Promise<void>;
  assignToReviewer: (briefId: string) => Promise<void>;
  isReviewerAssignedTo: (briefId: string) => boolean;
  visibleBriefs: Brief[];
  PIPELINE_STAGES: typeof PIPELINE_STAGES;
};

const VeloceContext = createContext<VeloceContextValue | null>(null);

const guestValue: VeloceContextValue = {
  briefs: [],
  analyses: new Map(),
  stageEvents: [],
  notes: [],
  assignments: [],
  estimateOverrides: new Map(),
  role: "admin",
  currentUserName: "",
  userId: "",
  syncing: false,
  defaultReviewerId: null,
  refreshWorkspace: async () => {},
  addIntakeBrief: async () => {},
  moveBriefToStage: async () => {},
  addNote: async () => {},
  overrideEstimate: async () => {},
  assignToReviewer: async () => {},
  isReviewerAssignedTo: () => false,
  visibleBriefs: [],
  PIPELINE_STAGES,
};

export function VeloceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(reducer, emptyState);
  const [syncing, setSyncing] = useState(false);
  const [defaultReviewerId, setDefaultReviewerId] = useState<string | null>(
    null,
  );

  const refreshWorkspace = useCallback(async () => {
    if (!user) {
      dispatch({ type: "RESET" });
      return;
    }
    setSyncing(true);
    try {
      const items: Brief[] = [];
      let cursor: string | null = null;
      do {
        const page = await listBriefsPage(cursor ?? undefined, 100);
        items.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor);

      const analyses = new Map<string, AiAnalysis>();
      const evById = new Map<string, StageEvent>();
      const noteById = new Map<string, Note>();
      const assignById = new Map<string, Assignment>();
      const estimateOverrides = new Map<string, EstimateOverride>();

      await Promise.all(
        items.map(async (b) => {
          const d = await getBriefDetail(b.id);
          if (d.analysis) analyses.set(b.id, d.analysis);
          for (const e of d.stageEvents) evById.set(e.id, e);
          for (const n of d.notes) noteById.set(n.id, n);
          for (const a of d.assignments) assignById.set(a.id, a);
          if (d.estimateOverride)
            estimateOverrides.set(b.id, d.estimateOverride);
        }),
      );

      const stageEvents = [...evById.values()].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
      );
      const notes = [...noteById.values()].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
      );
      const assignments = [...assignById.values()].sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
      );

      dispatch({
        type: "HYDRATE",
        briefs: items,
        analyses,
        stageEvents,
        notes,
        assignments,
        estimateOverrides,
      });
    } finally {
      setSyncing(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refreshWorkspace();
  }, [authLoading, refreshWorkspace]);

  useEffect(() => {
    if (user?.role === "admin") {
      void listUsers("reviewer")
        .then((u) => setDefaultReviewerId(u[0]?.id ?? null))
        .catch(() => setDefaultReviewerId(null));
    } else {
      setDefaultReviewerId(null);
    }
  }, [user]);

  const isReviewerAssignedTo = useCallback(
    (briefId: string) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      return state.assignments.some(
        (a) => a.briefId === briefId && a.assignedToId === user.id,
      );
    },
    [state.assignments, user],
  );

  const visibleBriefs = useMemo(() => {
    if (!user || user.role === "admin") return state.briefs;
    return state.briefs.filter((b) => isReviewerAssignedTo(b.id));
  }, [state.briefs, user, isReviewerAssignedTo]);

  const addIntakeBrief = useCallback(
    async (values: IntakeFormValues) => {
      await createBriefPublic(values);
      if (user) await refreshWorkspace();
    },
    [user, refreshWorkspace],
  );

  const moveBriefToStage = useCallback(
    async (briefId: string, toStage: PipelineStage) => {
      await patchBriefStage(briefId, toStage);
      await refreshWorkspace();
    },
    [refreshWorkspace],
  );

  const addNote = useCallback(
    async (input: {
      briefId: string;
      parentId: string | null;
      body: string;
    }) => {
      await postNote(input.briefId, {
        body: input.body,
        parentId: input.parentId,
      });
      await refreshWorkspace();
    },
    [refreshWorkspace],
  );

  const overrideEstimate = useCallback(
    async (input: {
      briefId: string;
      minHours: number;
      maxHours: number;
      reason: string;
    }) => {
      await postEstimateOverride(input.briefId, {
        minHours: input.minHours,
        maxHours: input.maxHours,
        reason: input.reason,
      });
      await refreshWorkspace();
    },
    [refreshWorkspace],
  );

  const assignToReviewer = useCallback(
    async (briefId: string) => {
      if (!defaultReviewerId) {
        throw new Error(
          "No reviewer available. Run seed script and ensure a reviewer user exists.",
        );
      }
      await postAssign(briefId, defaultReviewerId);
      await refreshWorkspace();
    },
    [defaultReviewerId, refreshWorkspace],
  );

  const value = useMemo<VeloceContextValue>(() => {
    if (!user) {
      return {
        ...guestValue,
        addIntakeBrief,
        refreshWorkspace,
      };
    }
    return {
      briefs: state.briefs,
      analyses: state.analyses,
      stageEvents: state.stageEvents,
      notes: state.notes,
      assignments: state.assignments,
      estimateOverrides: state.estimateOverrides,
      role: user.role,
      currentUserName: user.name,
      userId: user.id,
      syncing,
      defaultReviewerId,
      refreshWorkspace,
      addIntakeBrief,
      moveBriefToStage,
      addNote,
      overrideEstimate,
      assignToReviewer,
      isReviewerAssignedTo,
      visibleBriefs,
      PIPELINE_STAGES,
    };
  }, [
    user,
    state,
    syncing,
    defaultReviewerId,
    refreshWorkspace,
    addIntakeBrief,
    moveBriefToStage,
    addNote,
    overrideEstimate,
    assignToReviewer,
    isReviewerAssignedTo,
    visibleBriefs,
  ]);

  return (
    <VeloceContext.Provider value={value}>{children}</VeloceContext.Provider>
  );
}

export function useVeloce() {
  const ctx = useContext(VeloceContext);
  if (!ctx) throw new Error("useVeloce must be used within VeloceProvider");
  return ctx;
}
