import { ObjectId } from "mongodb";

import {
  decodeAccessToken,
  objectIdFromJwtSub,
  parseBearerToken,
} from "./auth";
import { COLLECTIONS } from "./collections";
import { getDb } from "./mongo";
import type { UserDoc } from "./user-doc";

export async function getCurrentUser(request: Request): Promise<UserDoc | null> {
  const token = parseBearerToken(request.headers.get("authorization"));
  if (!token) return null;
  let payload: Awaited<ReturnType<typeof decodeAccessToken>>;
  try {
    payload = await decodeAccessToken(token);
  } catch {
    return null;
  }
  const oid = objectIdFromJwtSub(payload.sub);
  if (!oid) return null;
  const db = await getDb();
  const user = await db
    .collection<UserDoc>(COLLECTIONS.users)
    .findOne({ _id: oid });
  return user;
}

export function requireAdmin(user: UserDoc): boolean {
  return user.role === "admin";
}

export async function loadUserById(id: ObjectId): Promise<UserDoc | null> {
  const db = await getDb();
  return db.collection<UserDoc>(COLLECTIONS.users).findOne({ _id: id });
}
