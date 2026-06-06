import { soncasResultSchema } from "@/src/core/domain/analysis-result-zod";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";

const DRIVER_LABEL_FR: Record<
  "securite" | "orgueil" | "nouveaute" | "confort" | "argent" | "sympathie",
  string
> = {
  securite: "Sécurité",
  orgueil: "Orgueil",
  nouveaute: "Nouveauté",
  confort: "Confort",
  argent: "Argent",
  sympathie: "Sympathie",
};

function modeSoncasDominantLabel(dominants: string[]): string | null {
  if (dominants.length === 0) return null;
  const counts = new Map<string, number>();
  for (const d of dominants) {
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  let bestKey = dominants[0]!;
  let bestCount = -1;
  for (const [k, n] of counts) {
    if (
      n > bestCount ||
      (n === bestCount && k.localeCompare(bestKey, "fr") < 0)
    ) {
      bestCount = n;
      bestKey = k;
    }
  }
  return DRIVER_LABEL_FR[bestKey as keyof typeof DRIVER_LABEL_FR] ?? bestKey;
}

export function postureLabelFromMeetings(
  meetings: RecentMeetingListRow[],
): string | null {
  const dominants: string[] = [];
  for (const m of meetings) {
    if (m.latestSoncasResult == null) continue;
    const parsed = soncasResultSchema.safeParse(m.latestSoncasResult);
    if (parsed.success) dominants.push(parsed.data.dominant);
  }
  return modeSoncasDominantLabel(dominants);
}

export function countMeetingTypes(meetings: RecentMeetingListRow[]): {
  decouverte: number;
  proposition: number;
} {
  let decouverte = 0;
  let proposition = 0;
  for (const m of meetings) {
    const t = (m.meetingType ?? "").trim().toLowerCase();
    if (t === "découverte" || t === "decouverte") decouverte += 1;
    else if (t === "proposition" || t.includes("proposition")) proposition += 1;
  }
  return { decouverte, proposition };
}

export function performanceParagraphText(
  text: string | undefined,
  options: {
    hasSummary: boolean;
    meetingCount: number;
    aiEnabled: boolean;
  },
): string | null {
  const trimmed = text?.trim();
  if (trimmed) return trimmed;
  if (!options.hasSummary) {
    if (options.meetingCount === 0) {
      return "Pas assez de données pour une analyse";
    }
    return options.aiEnabled
      ? "La synthèse automatique n’a pas pu être produite. Réessayez plus tard."
      : "Pour générer ce texte à partir des transcriptions et des analyses (SONCAS, DISC, KISS), configurez AI_GATEWAY_API_KEY.";
  }
  return "Ce bloc n’a pas été renseigné par la synthèse.";
}
