"use server";

import { z } from "zod";
import { requireOrgActor } from "@/lib/analysis-server-context";
import { prepareMeetingBriefing } from "@/src/core/application/prepare-meeting-briefing";
import { researchProspect } from "@/src/core/application/research-prospect";

const schema = z.object({
  personId: z.string().cuid(),
  targetStage: z.string().trim().min(1).max(120),
});

export async function prepareBriefingAction(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "VALIDATION" };

  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const result = await prepareMeetingBriefing(actor.deps, {
    organizationId: actor.organizationId,
    personId: parsed.data.personId,
    targetStage: parsed.data.targetStage,
  });

  if (!result) return { ok: false as const, error: "NOT_FOUND" };

  return {
    ok: true as const,
    personName: result.person.displayName,
    hasHistory: result.hasHistory,
    briefing: result.briefing,
  };
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const optionalUrl = optionalText(500).refine(
  (v) => v == null || /^https?:\/\/\S+$/i.test(v),
  "Adresse web invalide",
);

const researchSchema = z.object({
  companyName: z.string().trim().min(1).max(160),
  website: optionalUrl,
  personName: optionalText(160),
  personRole: optionalText(160),
  linkedinUrl: optionalUrl,
  profileText: optionalText(8000),
  targetStage: z.string().trim().min(1).max(120),
});

/** Prépare un premier rendez-vous par recherche web (méthode Seed). */
export async function researchProspectAction(
  input: z.input<typeof researchSchema>,
) {
  const parsed = researchSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "VALIDATION" };

  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const result = await researchProspect(actor.deps, {
    organizationId: actor.organizationId,
    ...parsed.data,
  });
  if (!result.ok) return { ok: false as const, error: result.error };
  return {
    ok: true as const,
    research: result.research,
    sources: result.sources,
  };
}
