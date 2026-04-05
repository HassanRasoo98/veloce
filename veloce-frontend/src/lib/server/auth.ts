import { jwtVerify, SignJWT } from "jose";
import { ObjectId } from "mongodb";

import { getEnv } from "./env";

export async function createAccessToken(
  sub: string,
  role: string,
  name: string,
): Promise<string> {
  const env = getEnv();
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const exp = new Date();
  exp.setUTCDate(exp.getUTCDate() + env.JWT_EXP_DAYS);

  return new SignJWT({ role, name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .setExpirationTime(exp)
    .sign(secret);
}

export async function decodeAccessToken(token: string) {
  const env = getEnv();
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  return payload;
}

export function parseBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const lower = authorization.toLowerCase();
  if (!lower.startsWith("bearer ")) return null;
  return authorization.slice(7).trim();
}

export function objectIdFromJwtSub(sub: unknown): ObjectId | null {
  if (typeof sub !== "string") return null;
  try {
    return new ObjectId(sub);
  } catch {
    return null;
  }
}
