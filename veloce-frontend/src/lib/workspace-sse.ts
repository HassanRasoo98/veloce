/** Same-origin or NEXT_PUBLIC_API_URL; must match `apiFetch`. */
function apiBase(): string {
  return typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
    : "";
}

/**
 * Reads an SSE response via fetch (so Authorization headers work; EventSource cannot).
 * Resolves when the stream ends or `signal` aborts.
 */
export async function consumeWorkspaceSse(
  path: string,
  init: { headers?: HeadersInit; signal: AbortSignal },
  onData: (obj: { type?: string }) => void,
): Promise<void> {
  const url = `${apiBase()}${path}`;
  const headers = new Headers(init.headers);
  headers.set("Accept", "text/event-stream");
  const res = await fetch(url, {
    signal: init.signal,
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `SSE ${res.status}`);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const dec = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += dec.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) {
          const json = line.slice(6).trim();
          if (!json) continue;
          try {
            onData(JSON.parse(json) as { type?: string });
          } catch {
            /* ignore malformed line */
          }
        }
      }
    }
  }
}
