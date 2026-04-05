import type { ObjectId } from "mongodb";

export type UserDoc = {
  _id: ObjectId;
  email: string;
  password_hash: string;
  name: string;
  role: "admin" | "reviewer";
};
