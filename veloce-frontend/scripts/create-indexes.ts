/**
 * One-shot index setup for MongoDB Atlas (run after deploy or when schema changes).
 * Requires MONGODB_URI (and optional MONGODB_DB) in env.
 *
 *   npm run create-indexes
 */
import { config } from "dotenv";
import type { Collection, CreateIndexesOptions, IndexDescription } from "mongodb";
import { MongoClient, MongoServerError } from "mongodb";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const dbName = process.env.MONGODB_DB || "veloce";

function keysEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => a[k] === b[k]);
}

/** Drop same-key index if Mongo gave it a different name, then create the named index. */
async function ensureNamedIndex(
  coll: Collection,
  keys: Record<string, 1 | -1>,
  options: CreateIndexesOptions,
): Promise<void> {
  const name = options.name;
  if (!name) throw new Error("ensureNamedIndex requires options.name");

  let list: IndexDescription[];
  try {
    list = await coll.indexes();
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 26) list = [];
    else throw e;
  }
  if (list.some((idx) => idx.name === name)) return;

  for (const idx of list) {
    if (idx.name === "_id_") continue;
    if (keysEqual(idx.key as Record<string, unknown>, keys)) {
      await coll.dropIndex(idx.name!);
      break;
    }
  }
  await coll.createIndex(keys, options);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const briefs = db.collection("briefs");
  await ensureNamedIndex(
    briefs,
    { submitted_at: -1, _id: -1 },
    { name: "briefs_submitted_at_id_desc" },
  );

  for (const coll of [
    "aianalyses",
    "stageevents",
    "notes",
    "assignments",
    "estimateoverrides",
  ] as const) {
    await ensureNamedIndex(db.collection(coll), { brief_id: 1 }, { name: `${coll}_brief_id` });
  }

  await ensureNamedIndex(
    db.collection("stageevents"),
    { brief_id: 1, at: -1 },
    { name: "stageevents_brief_id_at_desc" },
  );

  await ensureNamedIndex(
    db.collection("notes"),
    { brief_id: 1, at: -1 },
    { name: "notes_brief_id_at_desc" },
  );

  await ensureNamedIndex(
    db.collection("assignments"),
    { brief_id: 1, at: -1 },
    { name: "assignments_brief_id_at_desc" },
  );

  await ensureNamedIndex(
    db.collection("assignments"),
    { assigned_to_id: 1 },
    { name: "assignments_assigned_to_id" },
  );

  await ensureNamedIndex(
    db.collection("users"),
    { email: 1 },
    { unique: true, name: "users_email_unique" },
  );

  const idem = db.collection("idempotencykeys");
  await ensureNamedIndex(idem, { key: 1 }, { unique: true, name: "idempotencykeys_key_unique" });
  await ensureNamedIndex(idem, { created_at: 1 }, {
    expireAfterSeconds: 604800,
    name: "idempotencykeys_created_at_ttl_7d",
  });

  console.log("Indexes ensured on database:", dbName);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
