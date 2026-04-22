import {
  discResultSchema,
  soncasResultSchema,
} from "@/lib/analysis-result-zod";
import type { MeetingAnalysisRow } from "@/src/core/ports/meeting-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

export type OrgDashboardKpis = {
  meetingsLast30d: number;
  winRatePercent: number | null;
  soncasDominantCounts: Record<
    | "securite"
    | "orgueil"
    | "nouveaute"
    | "confort"
    | "argent"
    | "sympathie",
    number
  >;
  discDominantCounts: Record<"D" | "I" | "S" | "C", number>;
};

function latestPerMeeting(
  analyses: MeetingAnalysisRow[],
  kind: "SONCAS" | "DISC",
): Map<string, MeetingAnalysisRow> {
  const map = new Map<string, MeetingAnalysisRow>();
  for (const row of analyses) {
    if (row.kind !== kind) continue;
    if (!map.has(row.meetingId)) {
      map.set(row.meetingId, row);
    }
  }
  return map;
}

export async function getOrgDashboardKpis(
  deps: { meetings: MeetingRepositoryPort },
  input: { clerkOrgId: string | null },
): Promise<OrgDashboardKpis | null> {
  if (!input.clerkOrgId) return null;

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const total = await deps.meetings.countMeetingsWithMeetingAtSince({
    clerkOrgId: input.clerkOrgId,
    since,
  });
  const won = await deps.meetings.countMeetingsWithMeetingAtSinceAndOutcome({
    clerkOrgId: input.clerkOrgId,
    since,
    outcome: "WON",
  });

  const winRatePercent =
    total === 0 ? null : Math.round((100 * won) / total);

  const analyses = await deps.meetings.listAnalysesForOrgMeetingsSince({
    clerkOrgId: input.clerkOrgId,
    meetingAtSince: since,
    kinds: ["SONCAS", "DISC"],
  });

  const soncasLatest = latestPerMeeting(analyses, "SONCAS");
  const discLatest = latestPerMeeting(analyses, "DISC");

  const soncasDominantCounts: OrgDashboardKpis["soncasDominantCounts"] = {
    securite: 0,
    orgueil: 0,
    nouveaute: 0,
    confort: 0,
    argent: 0,
    sympathie: 0,
  };

  for (const row of soncasLatest.values()) {
    const parsed = soncasResultSchema.safeParse(row.result);
    if (parsed.success) {
      soncasDominantCounts[parsed.data.dominant] += 1;
    }
  }

  const discDominantCounts: OrgDashboardKpis["discDominantCounts"] = {
    D: 0,
    I: 0,
    S: 0,
    C: 0,
  };

  for (const row of discLatest.values()) {
    const parsed = discResultSchema.safeParse(row.result);
    if (parsed.success) {
      discDominantCounts[parsed.data.dominant] += 1;
    }
  }

  return {
    meetingsLast30d: total,
    winRatePercent,
    soncasDominantCounts,
    discDominantCounts,
  };
}
