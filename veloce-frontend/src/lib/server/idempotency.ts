import type { Db, ObjectId } from "mongodb";

import { COLLECTIONS } from "./collections";

export type IdempotencyScope = "intake" | "webhook";

export function normalizeIdempotencyHeader(request: Request): string | null {
  const raw =
    request.headers.get("Idempotency-Key") ??
    request.headers.get("idempotency-key");
  if (!raw) return null;
  const t = raw.trim();
  if (!t || t.length > 200) return null;
  return t;
}

export function fullIdempotencyKey(scope: IdempotencyScope, raw: string): string {
  return `${scope}:${raw}`;
}

export function isMongoDuplicateKey(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 11000
  );
}

type IdempotencyDoc = {
  key: string;
  brief_id: ObjectId | null;
  created_at: Date;
};

export type IdempotencyStart =
  | { kind: "proceed" }
  | { kind: "replay"; briefId: ObjectId }
  | { kind: "in_flight" };

/** Reserve key or return replay / in-flight when the same key is already used. */
export async function startIdempotentBriefCreate(
  db: Db,
  fullKey: string,
): Promise<IdempotencyStart> {
  const coll = db.collection<IdempotencyDoc>(COLLECTIONS.idempotencyKeys);
  try {
    await coll.insertOne({
      key: fullKey,
      brief_id: null,
      created_at: new Date(),
    });
    return { kind: "proceed" };
  } catch (e) {
    if (!isMongoDuplicateKey(e)) throw e;
    const doc = await coll.findOne({ key: fullKey });
    if (doc?.brief_id) return { kind: "replay", briefId: doc.brief_id };
    return { kind: "in_flight" };
  }
}

export async function finalizeIdempotencyKey(
  db: Db,
  fullKey: string,
  briefId: ObjectId,
): Promise<void> {
  await db.collection(COLLECTIONS.idempotencyKeys).updateOne(
    { key: fullKey, brief_id: null },
    { $set: { brief_id: briefId } },
  );
}

export async function releaseIdempotencyReservation(
  db: Db,
  fullKey: string,
): Promise<void> {
  await db
    .collection(COLLECTIONS.idempotencyKeys)
    .deleteOne({ key: fullKey, brief_id: null });
}
