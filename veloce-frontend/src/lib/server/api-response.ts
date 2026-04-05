export function jsonDetail(detail: unknown, status: number): Response {
  return Response.json({ detail }, { status });
}
