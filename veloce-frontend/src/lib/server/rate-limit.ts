import { Ratelimit } from "@upstash/ratelimit";

import { jsonDetail } from "./api-response";
import { getRedis } from "./redis";

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

let intakeLimiter: Ratelimit | null | undefined;
let webhookLimiter: Ratelimit | null | undefined;

function getIntakeLimiter(): Ratelimit | null {
  if (intakeLimiter !== undefined) return intakeLimiter;
  const redis = getRedis();
  if (!redis) {
    intakeLimiter = null;
    return null;
  }
  intakeLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "veloce:rl:intake",
  });
  return intakeLimiter;
}

function getWebhookLimiter(): Ratelimit | null {
  if (webhookLimiter !== undefined) return webhookLimiter;
  const redis = getRedis();
  if (!redis) {
    webhookLimiter = null;
    return null;
  }
  webhookLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "veloce:rl:webhook",
  });
  return webhookLimiter;
}

/**
 * Returns a 429 Response when rate limited, or null when allowed / Redis disabled.
 * Webhook limit runs after HMAC verification so invalid signatures do not consume quota.
 */
export async function rateLimitPublicWrite(
  request: Request,
  kind: "intake" | "webhook",
): Promise<Response | null> {
  const limiter = kind === "intake" ? getIntakeLimiter() : getWebhookLimiter();
  if (!limiter) return null;

  const ip = clientIp(request);
  const { success } = await limiter.limit(ip);
  if (success) return null;

  return jsonDetail("Too many requests. Try again shortly.", 429);
}
