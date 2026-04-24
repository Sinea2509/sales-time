/** Coerce Prisma Json `meetingTypes` / `pipelineStages` to string lists for selects. */
export function stringArrayFromOrgJson(
  value: unknown,
  fallback: string[],
): string[] {
  if (!Array.isArray(value)) return fallback;
  const out = value
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
  return out.length > 0 ? out : fallback;
}
