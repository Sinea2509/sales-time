import {
  discResultSchema,
  soncasResultSchema,
} from "@/src/core/domain/analysis-result-zod";
import type { MeetingAnalysisRow } from "@/src/core/ports/meeting-repository-port";
import type { MeetingRepositoryPort } from "@/src/core/ports/meeting-repository-port";

export type OrgDashboardKpis = {
  /** Nombre de RDV dans la fenêtre [`meetingAtSince`, maintenant). */
  meetingsInWindow: number;
  winRatePercent: number | null;
  soncasDominantCounts: Record<
    "securite" | "orgueil" | "nouveaute" | "confort" | "argent" | "sympathie",
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
  input: {
    organizationId: string | null;
    meetingAtSince: Date;
    sellerUserId?: string | null;
  },
): Promise<OrgDashboardKpis | null> {
  if (!input.organizationId) return null;

  const since = input.meetingAtSince;
  const seller =
    input.sellerUserId != null && input.sellerUserId !== ""
      ? input.sellerUserId
      : undefined;

  const total = await deps.meetings.countMeetingsWithMeetingAtSince({
    organizationId: input.organizationId,
    since,
    sellerUserId: seller,
  });
  const won = await deps.meetings.countMeetingsWithMeetingAtSinceAndOutcome({
    organizationId: input.organizationId,
    since,
    outcome: "WON",
    sellerUserId: seller,
  });

  const winRatePercent = total === 0 ? null : Math.round((100 * won) / total);

  const analyses = await deps.meetings.listAnalysesForOrgMeetingsSince({
    organizationId: input.organizationId,
    meetingAtSince: since,
    kinds: ["SONCAS", "DISC"],
    sellerUserId: seller,
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
    meetingsInWindow: total,
    winRatePercent,
    soncasDominantCounts,
    discDominantCounts,
  };
}
