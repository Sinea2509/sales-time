"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  DEFAULT_ARGUMENT_PHRASES,
  DEFAULT_OBJECTION_PHRASES,
  normalizePhraseKey,
} from "@/lib/onboarding-shared-default-phrases";
import { getApplicationDeps } from "@/lib/application-deps";
import type { OnboardingSharedPhraseKindSlug } from "@/src/core/ports/onboarding-shared-phrase-repository-port";

export type SharedPhraseRow = {
  id: string;
  text: string;
  source: "builtin" | "community";
};

const kindSchema = z.enum(["OBJECTION", "ARGUMENT"]);

const createPhraseSchema = z.object({
  kind: kindSchema,
  text: z
    .string()
    .trim()
    .min(3, "Phrase trop courte.")
    .max(300, "300 caractères maximum."),
});

function builtinsForKind(
  kind: OnboardingSharedPhraseKindSlug,
): readonly string[] {
  return kind === "OBJECTION"
    ? DEFAULT_OBJECTION_PHRASES
    : DEFAULT_ARGUMENT_PHRASES;
}

export type ListSharedPhrasesResult =
  | { ok: true; phrases: SharedPhraseRow[] }
  | { ok: false; message: string };

export async function listOnboardingSharedPhrases(
  rawKind: string,
): Promise<ListSharedPhrasesResult> {
  const kindParsed = kindSchema.safeParse(rawKind);
  if (!kindParsed.success) {
    return { ok: false, message: "Type invalide." };
  }
  const kind = kindParsed.data;

  const builtInSet = new Set(
    builtinsForKind(kind).map((t) => normalizePhraseKey(t)),
  );

  const builtIns: SharedPhraseRow[] = builtinsForKind(kind).map((text, i) => ({
    id: `builtin:${kind}:${i}`,
    text,
    source: "builtin" as const,
  }));

  const deps = getApplicationDeps();
  const dbRows = await deps.onboardingSharedPhrases.listByKind({
    kind,
    take: 150,
  });

  const community: SharedPhraseRow[] = [];
  for (const row of dbRows) {
    if (builtInSet.has(row.normalizedText)) continue;
    community.push({
      id: row.id,
      text: row.text,
      source: "community",
    });
  }

  return { ok: true, phrases: [...builtIns, ...community] };
}

export type CreateSharedPhraseResult =
  | { ok: true; phrase: SharedPhraseRow }
  | { ok: false; message: string };

export async function createOnboardingSharedPhrase(
  raw: z.input<typeof createPhraseSchema>,
): Promise<CreateSharedPhraseResult> {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    redirect("/sign-in");
  }

  const parsed = createPhraseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.flatten().formErrors[0] ?? "Phrase invalide.",
    };
  }

  const { kind, text } = parsed.data;
  const normalizedText = normalizePhraseKey(text);
  if (normalizedText.length < 3) {
    return { ok: false, message: "Phrase trop courte." };
  }

  const user = await deps.users.findById(principal.userId);
  if (!user) {
    return { ok: false, message: "Utilisateur introuvable." };
  }

  const builtInSet = new Set(
    builtinsForKind(kind).map((t) => normalizePhraseKey(t)),
  );
  if (builtInSet.has(normalizedText)) {
    return {
      ok: false,
      message: "Cette suggestion existe déjà dans la liste intégrée.",
    };
  }

  try {
    const row = await deps.onboardingSharedPhrases.createPhrase({
      kind,
      text: text.trim(),
      normalizedText,
      createdByUserId: user.id,
    });
    return {
      ok: true,
      phrase: { id: row.id, text: row.text, source: "community" },
    };
  } catch {
    return {
      ok: false,
      message: "Cette phrase existe déjà dans la collection partagée.",
    };
  }
}
