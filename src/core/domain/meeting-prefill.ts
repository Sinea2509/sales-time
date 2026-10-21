import { z } from "zod";
import {
  MEETING_OUTCOMES,
  type MeetingOutcome,
} from "@/src/core/domain/meeting-outcome";

/**
 * Ce que Sales Time propose de remplir à la place du commercial, à partir de
 * la conversation qu'il vient de déposer.
 *
 * Demande de Thomas du 21 octobre 2026 : déposer un rendez-vous demandait une
 * dizaine de champs avant toute analyse. Le commercial dépose d'abord, puis
 * vérifie et corrige ce qui a été lu dans la conversation.
 */
export type MeetingPrefill = {
  prospectName: string | null;
  meetingType: string | null;
  outcome: MeetingOutcome | null;
  potentialAmount: number | null;
  /** « 2026-09-29 », lue dans l'en-tête d'une transcription. */
  meetingDate: string | null;
  durationMin: number | null;
};

export const EMPTY_MEETING_PREFILL: MeetingPrefill = {
  prospectName: null,
  meetingType: null,
  outcome: null,
  potentialAmount: null,
  meetingDate: null,
  durationMin: null,
};

/** Ce que le modèle rend, avant toute vérification. */
export const meetingFactsSuggestionSchema = z.object({
  prospectName: z
    .string()
    .nullable()
    .describe(
      "Prénom et nom de l'interlocuteur principal côté prospect, tels qu'entendus. null si on ne l'entend pas.",
    ),
  prospectCompany: z
    .string()
    .nullable()
    .describe("L'entreprise du prospect, si elle est nommée. Sinon null."),
  meetingType: z
    .string()
    .nullable()
    .describe(
      "Exactement l'un des types de rendez-vous proposés, ou null si aucun ne correspond clairement.",
    ),
  outcome: z
    .enum(MEETING_OUTCOMES)
    .nullable()
    .describe(
      "WON : le prospect a signé ou dit oui ferme. LOST : il a refusé. FOLLOW_UP : une suite est prévue ou à prévoir. NO_SHOW : le rendez-vous n'a pas eu lieu. OTHER : autre. null si on ne peut pas le dire.",
    ),
  potentialAmount: z
    .number()
    .nullable()
    .describe(
      "Le montant en euros dont il est question pour cette affaire, s'il est cité. Sinon null.",
    ),
});

export type MeetingFactsSuggestion = z.infer<
  typeof meetingFactsSuggestionSchema
>;

/*
  Le début de la conversation dit qui parle et pourquoi ; la fin dit comment
  on se quitte. Le milieu n'apprend rien de plus pour ces champs, et le
  couper garde l'appel rapide et bon marché.
*/
export const PREFILL_HEAD_CHARS = 6_000;
export const PREFILL_TAIL_CHARS = 3_000;

export function transcriptExcerptForPrefill(transcript: string): string {
  const text = transcript.trim();
  if (text.length <= PREFILL_HEAD_CHARS + PREFILL_TAIL_CHARS) return text;
  return [
    text.slice(0, PREFILL_HEAD_CHARS),
    "[…]",
    text.slice(-PREFILL_TAIL_CHARS),
  ].join("\n");
}

function plain(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("fr-FR")
    .trim();
}

/** Des étiquettes de transcript, pas des noms de personnes. */
const NOT_A_NAME =
  /^(prospect|client|commercial|intervenant|interlocuteur|speaker|inconnu|unknown|n\/?a)\b/u;

const MAX_NAME_CHARS = 120;
const MAX_AMOUNT = 1e9;

/**
 * Garde ce qui est sûr dans la proposition du modèle : un nom qui en est un,
 * un type qui existe dans l'organisation, un montant plausible.
 */
export function sanitizeMeetingFactsSuggestion(
  raw: MeetingFactsSuggestion,
  meetingTypeOptions: readonly string[],
): Pick<
  MeetingPrefill,
  "prospectName" | "meetingType" | "outcome" | "potentialAmount"
> {
  const name = raw.prospectName?.trim() ?? "";
  const company = raw.prospectCompany?.trim() ?? "";
  const nameOk =
    name.length > 1 &&
    name.length <= MAX_NAME_CHARS &&
    !NOT_A_NAME.test(plain(name));
  const companyOk =
    company.length > 1 &&
    company.length <= MAX_NAME_CHARS &&
    !NOT_A_NAME.test(plain(company));
  // Sans nom de personne, l'entreprise identifie au moins le rendez-vous.
  const prospectName = nameOk ? name : companyOk ? company : null;

  const wanted = raw.meetingType ? plain(raw.meetingType) : "";
  const meetingType =
    meetingTypeOptions.find((option) => plain(option) === wanted) ?? null;

  const amount = raw.potentialAmount;
  const potentialAmount =
    amount != null &&
    Number.isFinite(amount) &&
    amount > 0 &&
    amount <= MAX_AMOUNT
      ? Math.round(amount * 100) / 100
      : null;

  return {
    prospectName,
    meetingType,
    outcome: raw.outcome ?? null,
    potentialAmount,
  };
}
