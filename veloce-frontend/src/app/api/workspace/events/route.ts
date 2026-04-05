import { jsonDetail } from "@/lib/server/api-response";
import { COLLECTIONS } from "@/lib/server/collections";
import { getEnv } from "@/lib/server/env";
import { getDb } from "@/lib/server/mongo";
import { getCurrentUser } from "@/lib/server/request-user";

export const runtime = "nodejs";

/** Vercel / long-lived SSE; increase on Pro if connections drop. */
export const maxDuration = 300;

const WATCH_COLLECTIONS = [
  COLLECTIONS.briefs,
  COLLECTIONS.stageEvents,
  COLLECTIONS.notes,
  COLLECTIONS.assignments,
  COLLECTIONS.estimateOverrides,
  COLLECTIONS.aiAnalyses,
] as const;

export async function GET(request: Request) {
  getEnv();
  const user = await getCurrentUser(request);
  if (!user) {
    return jsonDetail("Missing or invalid Authorization header", 401);
  }

  const db = await getDb();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let changeStream: import("mongodb").ChangeStream | undefined;

      const send = (payload: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      const cleanup = () => {
        void changeStream?.close().catch(() => {});
        changeStream = undefined;
      };

      const onAbort = () => {
        cleanup();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      request.signal.addEventListener("abort", onAbort);

      send({ type: "ready" });

      try {
        changeStream = db.watch(
          [
            {
              $match: {
                operationType: { $in: ["insert", "update", "replace", "delete"] },
                "ns.coll": { $in: [...WATCH_COLLECTIONS] },
              },
            },
          ],
          { fullDocument: "updateLookup" },
        );

        for await (const _ of changeStream) {
          if (request.signal.aborted) break;
          send({ type: "workspace_changed" });
        }
      } catch (err) {
        console.error("[workspace/events] change stream error", err);
        send({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        request.signal.removeEventListener("abort", onAbort);
        cleanup();
        try {
          controller.close();
        } catch {
          /* closed from abort */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
