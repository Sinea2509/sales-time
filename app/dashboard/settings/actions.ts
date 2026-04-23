"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

async function requireOrgAdminClerkOrgId(): Promise<string | null> {
  const superAdminOrgCookie = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(makeApplicationDeps(), {
    superAdminActiveClerkOrgId: superAdminOrgCookie,
  });
  if (
    ctx.kind !== "authenticated" ||
    !ctx.canManageOrganization ||
    !ctx.activeTenantClerkOrgId
  ) {
    return null;
  }
  return ctx.activeTenantClerkOrgId;
}

const orgContextSchema = z.object({
  companyName: z.string().max(200).optional().nullable(),
  industrySector: z.string().max(200).optional().nullable(),
  commercialTeamSize: z.string().max(120).optional().nullable(),
  averageSalesCycle: z.string().max(120).optional().nullable(),
  averageDealSize: z.string().max(120).optional().nullable(),
});

const orgCoachSchema = z.object({
  companyPitch: z.string().max(500).optional().nullable(),
  objections: z.array(z.string().max(300)).max(30),
  keyArguments: z.array(z.string().max(400)).max(30),
  industryVocabulary: z.string().max(500).optional().nullable(),
});

const orgProcessSchema = z.object({
  meetingTypes: z.array(z.string().max(120)).min(1).max(40),
  pipelineStages: z.array(z.string().max(120)).min(1).max(40),
});

export type OrgSettingsActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateOrganizationContext(
  raw: z.input<typeof orgContextSchema>,
): Promise<OrgSettingsActionResult> {
  const clerkOrgId = await requireOrgAdminClerkOrgId();
  if (!clerkOrgId) {
    return { ok: false, message: "Accès refusé." };
  }
  const parsed = orgContextSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const data = {
    companyName: parsed.data.companyName?.trim() || null,
    industrySector: parsed.data.industrySector?.trim() || null,
    commercialTeamSize: parsed.data.commercialTeamSize?.trim() || null,
    averageSalesCycle: parsed.data.averageSalesCycle?.trim() || null,
    averageDealSize: parsed.data.averageDealSize?.trim() || null,
  };
  await prisma.organizationSettings.upsert({
    where: { clerkOrgId },
    create: { clerkOrgId, ...data },
    update: data,
  });
  revalidatePath("/dashboard/settings", "layout");
  return { ok: true };
}

export async function updateOrganizationCoach(
  raw: z.input<typeof orgCoachSchema>,
): Promise<OrgSettingsActionResult> {
  const clerkOrgId = await requireOrgAdminClerkOrgId();
  if (!clerkOrgId) {
    return { ok: false, message: "Accès refusé." };
  }
  const parsed = orgCoachSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const data = {
    companyPitch: parsed.data.companyPitch?.trim() || null,
    objections: parsed.data.objections,
    keyArguments: parsed.data.keyArguments,
    industryVocabulary: parsed.data.industryVocabulary?.trim() || null,
  };
  await prisma.organizationSettings.upsert({
    where: { clerkOrgId },
    create: { clerkOrgId, ...data },
    update: data,
  });
  revalidatePath("/dashboard/settings", "layout");
  return { ok: true };
}

export async function updateOrganizationProcess(
  raw: z.input<typeof orgProcessSchema>,
): Promise<OrgSettingsActionResult> {
  const clerkOrgId = await requireOrgAdminClerkOrgId();
  if (!clerkOrgId) {
    return { ok: false, message: "Accès refusé." };
  }
  const parsed = orgProcessSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Ajoutez au moins un type de RDV et une étape de pipeline.",
    };
  }
  const data = {
    meetingTypes: parsed.data.meetingTypes,
    pipelineStages: parsed.data.pipelineStages,
  };
  await prisma.organizationSettings.upsert({
    where: { clerkOrgId },
    create: { clerkOrgId, ...data },
    update: data,
  });
  revalidatePath("/dashboard/settings", "layout");
  return { ok: true };
}
