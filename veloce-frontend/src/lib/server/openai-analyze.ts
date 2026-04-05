import OpenAI from "openai";
import { z } from "zod";

import { getEnv } from "./env";
import { parsedAnalysisSchema } from "./schemas";

const SYSTEM_PROMPT = `You analyze software project briefs for an agency. Respond with a single JSON object only (no markdown), using exactly these keys:
- "features": array of 3-8 short requirement strings derived from the brief
- "category": exactly one of: "Web App", "Mobile", "AI/ML", "Automation", "Integration"
- "effort_hours_min": positive integer (estimated engineering hours, lower bound)
- "effort_hours_max": positive integer (upper bound, must be >= effort_hours_min)
- "tech_stack": array of 3-8 suggested technologies
- "complexity": integer from 1 to 5 (5 = hardest)`;

export type ParsedAnalysis = z.infer<typeof parsedAnalysisSchema>;

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
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await client.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      });
      const raw = resp.choices[0]?.message?.content;
      if (!raw) {
        lastErr = "Empty model response";
        continue;
      }
      const data = JSON.parse(raw) as unknown;
      const parsed = parsedAnalysisSchema.parse(data);
      return { parsed, error: null };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      if (e instanceof z.ZodError) {
        console.warn("OpenAI parse attempt failed:", e.issues);
      } else {
        console.warn("OpenAI API attempt failed:", e);
      }
    }
  }
  return { parsed: null, error: lastErr ?? "Analysis failed" };
}
