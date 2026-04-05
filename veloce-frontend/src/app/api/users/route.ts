import { jsonDetail } from "@/lib/server/api-response";
import { COLLECTIONS } from "@/lib/server/collections";
import { getEnv } from "@/lib/server/env";
import { getDb } from "@/lib/server/mongo";
import { getCurrentUser } from "@/lib/server/request-user";
import type { UserDoc } from "@/lib/server/user-doc";

export const runtime = "nodejs";

export async function GET(request: Request) {
  getEnv();
  const user = await getCurrentUser(request);
  if (!user) {
    return jsonDetail("Missing or invalid Authorization header", 401);
  }

  const url = new URL(request.url);
  const role = url.searchParams.get("role");

  const db = await getDb();

  if (role === "reviewer") {
    const users = await db
      .collection<UserDoc>(COLLECTIONS.users)
      .find({ role: "reviewer" })
      .sort({ email: 1 })
      .toArray();
    return Response.json(
      users.map((u) => ({
        id: u._id.toHexString(),
        email: u.email,
        name: u.name,
        role: u.role,
      })),
    );
  }

  if (user.role !== "admin") {
    return jsonDetail("Admin only", 403);
  }

  const users = await db
    .collection<UserDoc>(COLLECTIONS.users)
    .find({})
    .sort({ email: 1 })
    .toArray();

  return Response.json(
    users.map((u) => ({
      id: u._id.toHexString(),
      email: u.email,
      name: u.name,
      role: u.role,
    })),
  );
}
