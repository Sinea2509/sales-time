"use server";

import { z } from "zod";
import {
  DEFAULT_ARGUMENT_PHRASES,
  DEFAULT_OBJECTION_PHRASES,
} from "@/lib/onboarding-shared-default-phrases";
import type { OnboardingSharedPhraseKindSlug } from "@/src/core/ports/onboarding-shared-phrase-repository-port";

export type CoachSharedPhraseRow = {
  id: string;
  text: string;
  source: "builtin" | "community";
};

const kindSchema = z.enum(["OBJECTION", "ARGUMENT"]);

function builtinsForKind(
  kind: OnboardingSharedPhraseKindSlug,
): readonly string[] {
  return kind === "OBJECTION"
    ? DEFAULT_OBJECTION_PHRASES
    : DEFAULT_ARGUMENT_PHRASES;
}

export type ListCoachSharedPhrasesResult =
  | { ok: true; phrases: CoachSharedPhraseRow[] }
  | { ok: false; message: string };

/**
 * Les suggestions proposées dans l'onboarding et les réglages Coach IA.
 *
 * Seulement la liste intégrée à Sales Time. La « collection partagée »
 * mêlait aux suggestions les formulations saisies par les autres
 * organisations : l'objection ou l'argument d'un client devenait lisible par
 * tous les autres. Sales Time est vendu à plusieurs entreprises, parfois
 * concurrentes : une formulation saisie par une organisation reste désormais
 * dans sa liste. La collection n'est plus ni lue ni alimentée par les
 * organisations, et l'action qui l'alimentait a disparu : son message
 * « existe déjà » révélait même ce qu'une autre organisation avait saisi.
 */
export async function listCoachSharedPhrases(
  rawKind: string,
): Promise<ListCoachSharedPhrasesResult> {
  const kindParsed = kindSchema.safeParse(rawKind);
  if (!kindParsed.success) {
    return { ok: false, message: "Type invalide." };
  }
  const kind = kindParsed.data;

  const builtIns: CoachSharedPhraseRow[] = builtinsForKind(kind).map(
    (text, i) => ({
      id: `builtin:${kind}:${i}`,
      text,
      source: "builtin" as const,
    }),
  );

  return { ok: true, phrases: builtIns };
}
