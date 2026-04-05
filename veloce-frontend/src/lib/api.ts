import type { IntakeFormValues } from "@/types/veloce";
import type {
  AiAnalysis,
  Assignment,
  Brief,
  EstimateOverride,
  Note,
  PipelineStage,
  StageEvent,
} from "@/types/veloce";

/** Empty base = same-origin (Vercel / `next dev`). Set NEXT_PUBLIC_API_URL only to call a separate API (e.g. legacy split dev). */
const BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
    : "";

const TOKEN_KEY = "veloce_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export type MeUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "reviewer";
};

export type BriefDetailApi = {
  brief: Brief;
  analysis: AiAnalysis | null;
  analysisError: string | null;
  stageEvents: StageEvent[];
  notes: Note[];
  assignments: Assignment[];
  estimateOverride: EstimateOverride | null;
};

export type BriefListPage = {
  items: Brief[];
  nextCursor: string | null;
};

async function parseError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: string | unknown };
    if (typeof j.detail === "string") return j.detail;
    return JSON.stringify(j.detail ?? j);
  } catch {
    return await res.text();
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!init.skipAuth) {
    const t = getStoredToken();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }
  if (init.body && typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<{ access_token: string }> {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
}

export async function meRequest(): Promise<MeUser> {
  return apiFetch("/api/auth/me");
}

export async function listUsers(role?: "reviewer"): Promise<MeUser[]> {
  const q = role ? `?role=${role}` : "";
  return apiFetch(`/api/users${q}`);
}

export async function listBriefsPage(
  cursor?: string,
  limit = 100,
): Promise<BriefListPage> {
  const q = new URLSearchParams({ limit: String(limit) });
  if (cursor) q.set("cursor", cursor);
  return apiFetch(`/api/briefs?${q}`);
}

export async function getBriefDetail(id: string): Promise<BriefDetailApi> {
  return apiFetch(`/api/briefs/${id}`);
}

export async function createBriefPublic(
  body: IntakeFormValues,
): Promise<{ brief: Brief; analysis: AiAnalysis | null; analysisError: string | null }> {
  return apiFetch("/api/briefs", {
    method: "POST",
    body: JSON.stringify(body),
    skipAuth: true,
  });
}

export async function patchBriefStage(
  id: string,
  toStage: PipelineStage,
): Promise<{ ok: boolean; brief: Brief }> {
  return apiFetch(`/api/briefs/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ toStage }),
  });
}

export async function postNote(
  id: string,
  input: { body: string; parentId: string | null },
): Promise<Note> {
  return apiFetch(`/api/briefs/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({
      body: input.body,
      parentId: input.parentId,
    }),
  });
}

export async function postEstimateOverride(
  id: string,
  input: { minHours: number; maxHours: number; reason: string },
): Promise<EstimateOverride> {
  return apiFetch(`/api/briefs/${id}/estimate-override`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function postAssign(
  id: string,
  assignedToUserId: string,
): Promise<Assignment> {
  return apiFetch(`/api/briefs/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ assignedToUserId }),
  });
}
