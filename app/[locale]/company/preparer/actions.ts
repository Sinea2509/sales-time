"use server";

import { z } from "zod";
import { requireOrgActor } from "@/lib/analysis-server-context";
import { prepareMeetingBriefing } from "@/src/core/application/prepare-meeting-briefing";

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
