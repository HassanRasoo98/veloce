import { MongoClient, type Db } from "mongodb";

import { getEnv } from "./env";

declare global {
  var _veloceMongoClient: MongoClient | undefined;
}

export async function getMongoClient(): Promise<MongoClient> {
  const env = getEnv();
  if (!globalThis._veloceMongoClient) {
    globalThis._veloceMongoClient = new MongoClient(env.MONGODB_URI);
  }
  const client = globalThis._veloceMongoClient;
  await client.connect();
  return client;
}

export async function getDb(): Promise<Db> {
  const env = getEnv();
  const client = await getMongoClient();
  return client.db(env.MONGODB_DB);
}
