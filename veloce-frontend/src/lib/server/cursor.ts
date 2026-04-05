import { ObjectId } from "mongodb";

export function encodeCursor(submittedAt: Date, docId: ObjectId): string {
  const t = submittedAt.toISOString();
  const payload = JSON.stringify({ t, id: docId.toHexString() });
  return Buffer.from(payload, "utf8")
    .toString("base64url")
    .replace(/=+$/, "");
}

export function decodeCursor(cursor: string): { t: Date; id: ObjectId } {
  const padLen = (4 - (cursor.length % 4)) % 4;
  const padded = cursor + "=".repeat(padLen);
  const raw = Buffer.from(padded, "base64url").toString("utf8");
  const d = JSON.parse(raw) as { t: string; id: string };
  const t = new Date(
    d.t.endsWith("Z") || d.t.includes("+") ? d.t : `${d.t}Z`,
  );
  return { t, id: new ObjectId(d.id) };
}
