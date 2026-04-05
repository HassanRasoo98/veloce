import OpenAI, { APIError, RateLimitError } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { getEnv } from "./env";
import { parsedAnalysisSchema } from "./schemas";

const INSTRUCTIONS = `You analyze software project briefs for an agency.
Return a structured analysis:
- features: 3-8 short requirement strings derived from the brief
- category: exactly one of: Web App, Mobile, AI/ML, Automation, Integration
- effort_hours_min / effort_hours_max: positive integers (engineering hours), max must be >= min
- tech_stack: 3-8 suggested technologies
- complexity: integer from 1 to 5 (5 = hardest)`;

const briefAnalysisFormat = zodTextFormat(parsedAnalysisSchema, "brief_analysis");

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;

export type ParsedAnalysis = z.infer<typeof parsedAnalysisSchema>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRefusal(response: {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; refusal?: string }>;
  }>;
}): string | null {
  for (const item of response.output ?? []) {
    if (item.type !== "message" || !item.content) continue;
    for (const part of item.content) {
      if (part.type === "refusal" && typeof part.refusal === "string") {
        return part.refusal;
      }
    }
  }
  return null;
}

function backoffMsForAttempt(attempt: number, err: unknown): number {
  if (err instanceof RateLimitError) {
    return Math.min(8000, 2000 * (attempt + 1));
  }
  if (err instanceof APIError && err.status === 503) {
    return Math.min(6000, 1500 * (attempt + 1));
  }
  return BASE_BACKOFF_MS * (attempt + 1);
}

export async function analyzeBrief(input: {
  title: string;
  descriptionRich: string;
  budgetTier: string;
  timelineUrgency: string;
}): Promise<{ parsed: ParsedAnalysis | null; error: string | null }> {
  const env = getEnv();
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const userContent =
    `Title: ${input.title}\n` +
    `Budget tier: ${input.budgetTier}\n` +
    `Timeline urgency: ${input.timelineUrgency}\n\n` +
    `Description:\n${input.descriptionRich}`;

  let lastErr: string | null = null;
  let lastThrowable: unknown = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await client.responses.parse({
        model: env.OPENAI_MODEL,
        instructions: INSTRUCTIONS,
        input: [
          {
            role: "user",
            content: userContent,
          },
        ],
        text: {
          format: briefAnalysisFormat,
        },
      });

      lastThrowable = null;

      if (response.output_parsed) {
        return { parsed: response.output_parsed, error: null };
      }

      const refusal = extractRefusal(response);
      lastErr = refusal
        ? `Model refused: ${refusal}`
        : "Structured output was empty or could not be parsed";
      console.warn(
        `[analyzeBrief] attempt ${attempt + 1}/${MAX_ATTEMPTS}:`,
        lastErr,
      );
    } catch (e) {
      lastThrowable = e;
      lastErr = e instanceof Error ? e.message : String(e);
      if (e instanceof z.ZodError) {
        console.warn("[analyzeBrief] schema validation failed:", e.issues);
        lastErr = `Invalid structured output: ${e.issues.map((i) => i.message).join("; ")}`;
      } else if (e instanceof APIError) {
        console.warn(
          `[analyzeBrief] API error (status ${e.status ?? "?"}):`,
          e.message,
        );
      } else {
        console.warn("[analyzeBrief] request failed:", e);
      }
    }

    if (attempt < MAX_ATTEMPTS - 1) {
      await sleep(backoffMsForAttempt(attempt, lastThrowable));
    }
  }

  return { parsed: null, error: lastErr ?? "Analysis failed" };
}
