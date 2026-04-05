import { jsonDetail } from "@/lib/server/api-response";
import { createAccessToken } from "@/lib/server/auth";
import { COLLECTIONS } from "@/lib/server/collections";
import { getEnv } from "@/lib/server/env";
import { getDb } from "@/lib/server/mongo";
import { verifyPassword } from "@/lib/server/passwords";
import { loginRequestSchema } from "@/lib/server/schemas";
import type { UserDoc } from "@/lib/server/user-doc";

export const runtime = "nodejs";

export async function POST(request: Request) {
  getEnv();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonDetail("Invalid JSON", 400);
  }

  const parsed = loginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonDetail(parsed.error.issues, 422);
  }

  const { email, password } = parsed.data;
  const db = await getDb();
  const user = await db
    .collection<UserDoc>(COLLECTIONS.users)
    .findOne({ email });

  if (!user || !verifyPassword(password, user.password_hash)) {
    return jsonDetail("Invalid email or password", 401);
  }

  const access_token = await createAccessToken(
    user._id.toHexString(),
    user.role,
    user.name,
  );

  return Response.json({
    access_token,
    token_type: "bearer",
  });
}
