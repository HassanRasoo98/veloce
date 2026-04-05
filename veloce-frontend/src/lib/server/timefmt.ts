export function isoZ(dt: Date): string {
  const d = Number.isNaN(dt.getTime()) ? new Date() : dt;
  return d.toISOString().replace("+00:00", "Z");
}
