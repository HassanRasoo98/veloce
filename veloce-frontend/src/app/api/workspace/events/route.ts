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

      const safeSend = (payload: unknown) => {
        try {
          send(payload);
        } catch {
          /* controller closed / client disconnected */
        }
      };

      const onAbort = () => {
        void changeStream?.close().catch(() => {});
      };
      request.signal.addEventListener("abort", onAbort);

      safeSend({ type: "ready" });

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
      } catch (err) {
        console.error("[workspace/events] failed to open change stream", err);
        safeSend({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Change streams unavailable (replica set required)",
        });
        request.signal.removeEventListener("abort", onAbort);
        try {
          controller.close();
        } catch {
          /* */
        }
        return;
      }

      await new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };

        changeStream!.on("change", () => {
          if (request.signal.aborted) return;
          safeSend({ type: "workspace_changed" });
        });

        changeStream!.once("close", finish);

        changeStream!.once("error", (err: unknown) => {
          if (!request.signal.aborted) {
            console.warn("[workspace/events] change stream error", err);
            safeSend({
              type: "error",
              message: err instanceof Error ? err.message : String(err),
            });
          }
          finish();
        });
      });

      request.signal.removeEventListener("abort", onAbort);
      void changeStream?.close().catch(() => {});
      changeStream = undefined;
      try {
        controller.close();
      } catch {
        /* already closed */
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
