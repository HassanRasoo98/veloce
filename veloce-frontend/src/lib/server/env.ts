import { z } from "zod";

const schema = z
  .object({
    MONGODB_URI: z.string().min(1),
    MONGODB_DB: z.string().min(1).default("veloce"),
    OPENAI_API_KEY: z.string().min(1),
    OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
    JWT_SECRET: z.string().min(1),
    JWT_EXP_DAYS: z.coerce.number().int().positive().default(7),
    WEBHOOK_HMAC_SECRET: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.string().min(1).optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  })
  .refine(
    (e) => {
      const u = Boolean(e.UPSTASH_REDIS_REST_URL?.trim());
      const t = Boolean(e.UPSTASH_REDIS_REST_TOKEN?.trim());
      return u === t;
    },
    { message: "Set both Upstash URL and token, or omit both for local dev." },
  );

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
