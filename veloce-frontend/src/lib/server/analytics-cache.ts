import type { AnalyticsSummary } from "./analytics-summary";
import { getRedis } from "./redis";

const GEN_KEY = "veloce:analytics:gen";
const SUMMARY_PREFIX = "veloce:analytics:summary:";
const SUMMARY_TTL_SEC = 120;

type CachedEnvelope = { gen: number; data: AnalyticsSummary };

function summaryRedisKey(userId: string): string {
  return `${SUMMARY_PREFIX}${userId}`;
}

async function readGen(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  const v = await redis.get<number>(GEN_KEY);
  return typeof v === "number" ? v : 0;
}

/** Bump invalidates all cached analytics summaries in one atomic step. */
export async function bumpAnalyticsCacheGeneration(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.incr(GEN_KEY);
}

export async function getCachedAnalyticsSummary(
  userId: string,
): Promise<AnalyticsSummary | null> {
  const redis = getRedis();
  if (!redis) return null;

  const gen = await readGen();
  const raw = await redis.get<CachedEnvelope>(summaryRedisKey(userId));
  if (!raw || typeof raw !== "object") return null;
  if (!("gen" in raw) || !("data" in raw)) return null;
  if (raw.gen !== gen) return null;
  return raw.data as AnalyticsSummary;
}

export async function setCachedAnalyticsSummary(
  userId: string,
  data: AnalyticsSummary,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const gen = await readGen();
  const envelope: CachedEnvelope = { gen, data };
  await redis.set(summaryRedisKey(userId), envelope, { ex: SUMMARY_TTL_SEC });
}
