"use server";

import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { prepareMeetingBriefing } from "@/src/core/application/prepare-meeting-briefing";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { z } from "zod";

const schema = z.object({
  personId: z.string().cuid(),
  targetStage: z.string().trim().min(1).max(120),
});

export async function prepareBriefingAction(input: z.infer<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "VALIDATION" };

  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" };

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: superAdminOrg },
  );
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return { ok: false as const, error: "NO_ORG" };
  }

  const result = await prepareMeetingBriefing(deps, {
    organizationId: ctx.activeOrganizationId,
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
