/**
 * Create default admin and reviewer if missing.
 * Run from veloce-frontend: npm run seed-users
 * Loads .env.local then .env (same vars as Vercel / former Python backend).
 */
import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { resolve } from "path";

import { COLLECTIONS } from "../src/lib/server/collections";
import { hashPassword } from "../src/lib/server/passwords";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
  }
  const dbName = process.env.MONGODB_DB || "veloce";

  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL || "admin@veloce.local"
  ).toLowerCase();
  const adminPass = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const adminName = process.env.SEED_ADMIN_NAME || "Admin User";

  const revEmail = (
    process.env.SEED_REVIEWER_EMAIL || "reviewer@veloce.local"
  ).toLowerCase();
  const revPass = process.env.SEED_REVIEWER_PASSWORD || "reviewer123";
  const revName = process.env.SEED_REVIEWER_NAME || "Reviewer User";

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection(COLLECTIONS.users);

  if (!(await users.findOne({ email: adminEmail }))) {
    await users.insertOne({
      email: adminEmail,
      password_hash: hashPassword(adminPass),
      name: adminName,
      role: "admin",
    });
    console.log(`Created admin: ${adminEmail}`);
  } else {
    console.log(`Admin exists: ${adminEmail}`);
  }

  if (!(await users.findOne({ email: revEmail }))) {
    await users.insertOne({
      email: revEmail,
      password_hash: hashPassword(revPass),
      name: revName,
      role: "reviewer",
    });
    console.log(`Created reviewer: ${revEmail}`);
  } else {
    console.log(`Reviewer exists: ${revEmail}`);
  }

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
