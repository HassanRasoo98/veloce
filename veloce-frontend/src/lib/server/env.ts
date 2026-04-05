import { z } from "zod";

const schema = z.object({
  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().min(1).default("veloce"),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  JWT_SECRET: z.string().min(1),
  JWT_EXP_DAYS: z.coerce.number().int().positive().default(7),
  WEBHOOK_HMAC_SECRET: z.string().min(1),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  cached = schema.parse(process.env);
  return cached;
}

export function resetEnvCache(): void {
  cached = null;
}
