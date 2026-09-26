/**
 * Le bilan hebdomadaire envoyé au manager : ce qui s'est passé cette semaine,
 * comparé à la précédente, et les trois rendez-vous à relire.
 *
 * Il ne calcule rien que le tableau de bord ne montre déjà ; il choisit ce
 * qui vaut un e-mail le lundi matin. Un manager qui ne l'ouvre pas doit
 * pouvoir se contenter de la première ligne.
 */
export type DigestMeeting = {
  id: string;
  prospectName: string;
  prospectCompany: string | null;
  sellerUserId: string;
  sellerFirstName: string | null;
  sellerLastName: string | null;
  sellerEmail: string | null;
  meetingAt: Date;
  salesScore: number | null;
  hasKiss: boolean;
};

export type DigestMember = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: "ADMIN" | "MEMBER";
};

export type DigestMeetingLine = {
  id: string;
  prospectName: string;
  prospectCompany: string | null;
  sellerName: string;
  salesScore: number;
};

export type WeeklyManagerDigest = {
  meetingsCount: number;
  analyzedCount: number;
  previousMeetingsCount: number;
  averageSalesScore: number | null;
  previousAverageSalesScore: number | null;
  /** Points sur 100 entre les deux semaines ; nul quand l'une n'a pas de score. */
  salesScoreDelta: number | null;
  bestMeetings: DigestMeetingLine[];
  meetingsToReview: DigestMeetingLine[];
  /** Commerciaux (rôle membre) sans aucun rendez-vous enregistré cette semaine. */
  silentSellers: string[];
};

const TOP_COUNT = 3;

export function memberDisplayName(m: {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}): string {
  const full = [m.firstName, m.lastName]
    .filter((s): s is string => Boolean(s?.trim()))
    .join(" ");
  return full || m.email || "Commercial";
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function toLine(m: DigestMeeting, score: number): DigestMeetingLine {
  return {
    id: m.id,
    prospectName: m.prospectName,
    prospectCompany: m.prospectCompany,
    sellerName: memberDisplayName({
      firstName: m.sellerFirstName,
      lastName: m.sellerLastName,
      email: m.sellerEmail,
    }),
    salesScore: score,
  };
}

/**
 * Rend `null` quand il n'y a rien à dire : aucune réunion sur les deux
 * semaines. Un e-mail vide chaque lundi apprendrait au manager à ne plus
 * ouvrir les suivants.
 */
export function weeklyManagerDigest(input: {
  meetings: ReadonlyArray<DigestMeeting>;
  previousMeetings: ReadonlyArray<DigestMeeting>;
  members: ReadonlyArray<DigestMember>;
}): WeeklyManagerDigest | null {
  if (input.meetings.length === 0 && input.previousMeetings.length === 0) {
    return null;
  }

  const scored = input.meetings
    .filter(
      (m): m is DigestMeeting & { salesScore: number } =>
        typeof m.salesScore === "number",
    )
    .sort((a, b) => b.salesScore - a.salesScore);

  const best = scored.slice(0, TOP_COUNT).map((m) => toLine(m, m.salesScore));
  const bestIds = new Set(best.map((b) => b.id));
  /*
    Les rendez-vous à relire sont les moins bien notés, mais jamais ceux déjà
    cités en tête : avec deux rendez-vous dans la semaine, le meilleur ne
    doit pas aussi figurer parmi les « à relire ».
  */
  const toReview = [...scored]
    .reverse()
    .filter((m) => !bestIds.has(m.id))
    .slice(0, TOP_COUNT)
    .map((m) => toLine(m, m.salesScore));

  const averageSalesScore = average(scored.map((m) => m.salesScore));
  const previousAverageSalesScore = average(
    input.previousMeetings
      .map((m) => m.salesScore)
      .filter((s): s is number => typeof s === "number"),
  );

  const activeSellerIds = new Set(input.meetings.map((m) => m.sellerUserId));
  const silentSellers = input.members
    .filter((m) => m.role === "MEMBER" && !activeSellerIds.has(m.userId))
    .map(memberDisplayName)
    .sort((a, b) => a.localeCompare(b, "fr"));

  return {
    meetingsCount: input.meetings.length,
    analyzedCount: input.meetings.filter(
      (m) => m.hasKiss || typeof m.salesScore === "number",
    ).length,
    previousMeetingsCount: input.previousMeetings.length,
    averageSalesScore,
    previousAverageSalesScore,
    salesScoreDelta:
      averageSalesScore != null && previousAverageSalesScore != null
        ? averageSalesScore - previousAverageSalesScore
        : null,
    bestMeetings: best,
    meetingsToReview: toReview,
    silentSellers,
  };
}
