import { jsonDetail } from "@/lib/server/api-response";
import {
  getCachedAnalyticsSummary,
  setCachedAnalyticsSummary,
} from "@/lib/server/analytics-cache";
import { computeAnalyticsSummary } from "@/lib/server/analytics-summary";
import { getEnv } from "@/lib/server/env";
import { getDb } from "@/lib/server/mongo";
import { getCurrentUser } from "@/lib/server/request-user";

export const runtime = "nodejs";

export async function GET(request: Request) {
  getEnv();
  const user = await getCurrentUser(request);
  if (!user) {
    return jsonDetail("Missing or invalid Authorization header", 401);
  }

  const cached = await getCachedAnalyticsSummary(user._id.toHexString());
  if (cached) {
    return Response.json(cached);
  }

  const db = await getDb();
  const summary = await computeAnalyticsSummary(db, user);
  await setCachedAnalyticsSummary(user._id.toHexString(), summary);
  return Response.json(summary);
}
