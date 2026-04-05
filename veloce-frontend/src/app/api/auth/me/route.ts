import { jsonDetail } from "@/lib/server/api-response";
import { getEnv } from "@/lib/server/env";
import { getCurrentUser } from "@/lib/server/request-user";

export const runtime = "nodejs";

export async function GET(request: Request) {
  getEnv();
  const user = await getCurrentUser(request);
  if (!user) {
    return jsonDetail("Missing or invalid Authorization header", 401);
  }
  return Response.json({
    id: user._id.toHexString(),
    email: user.email,
    name: user.name,
    role: user.role,
  });
}
