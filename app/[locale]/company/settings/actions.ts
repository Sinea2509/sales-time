"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getApplicationDeps } from "@/lib/application-deps";
import { loadOrgSettingsAccess } from "@/lib/load-org-settings-access";
import { uploadOrgLogoToBlob } from "@/lib/org-logo-upload";

type OrgSettingsActor =
  | {
      organizationId: string;
      userId: string;
      canManageOrganizationSettings: boolean;
    }
  | null;

async function requireOrgSettingsActor(): Promise<OrgSettingsActor> {
  const access = await loadOrgSettingsAccess();
  if (!access) return null;
  return {
    organizationId: access.actor.activeOrganizationId!,
    userId: access.actor.internalUserId,
    canManageOrganizationSettings: access.canManageOrganizationSettings,
  };
}

async function requireOrgAdminOrganizationId(): Promise<string | null> {
  const actor = await requireOrgSettingsActor();
  if (!actor?.canManageOrganizationSettings) return null;
  return actor.organizationId;
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

export type OrgLogoUploadResult =
  | { ok: true; logoUrl: string }
  | { ok: false; message: string };

export async function updateOrganizationContext(
  raw: z.input<typeof orgContextSchema>,
): Promise<OrgSettingsActionResult> {
  const organizationId = await requireOrgAdminOrganizationId();
  if (!organizationId) {
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
  const deps = getApplicationDeps();
  await deps.organizationSettings.upsertContextFields(organizationId, data);
  revalidatePath("/company/settings", "layout");
  return { ok: true };
}

export async function updateOrganizationCoach(
  raw: z.input<typeof orgCoachSchema>,
): Promise<OrgSettingsActionResult> {
  const organizationId = await requireOrgAdminOrganizationId();
  if (!organizationId) {
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
  const deps = getApplicationDeps();
  await deps.organizationSettings.upsertCoachFields(organizationId, data);
  revalidatePath("/company/settings", "layout");
  return { ok: true };
}

export async function updateOrganizationProcess(
  raw: z.input<typeof orgProcessSchema>,
): Promise<OrgSettingsActionResult> {
  const organizationId = await requireOrgAdminOrganizationId();
  if (!organizationId) {
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
  const deps = getApplicationDeps();
  await deps.organizationSettings.upsertProcessFields(organizationId, data);
  revalidatePath("/company/settings", "layout");
  revalidatePath("/company");
  revalidatePath("/company/rendez-vous/nouveau");
  revalidatePath("/company/preparer");
  return { ok: true };
}

const followUpEmailSchema = z.object({
  emailTone: z.enum(["formal", "informal"]).nullable(),
  emailVouvoiement: z.boolean(),
  emailSignature: z.string().max(10_000).nullable(),
});

export async function uploadOrganizationLogo(
  formData: FormData,
): Promise<OrgLogoUploadResult> {
  const organizationId = await requireOrgAdminOrganizationId();
  if (!organizationId) {
    return { ok: false, message: "Accès refusé." };
  }
  const file = formData.get("logo");
  if (!(file instanceof File)) {
    return { ok: false, message: "Aucun fichier reçu." };
  }
  const uploaded = await uploadOrgLogoToBlob(organizationId, file);
  if (!uploaded.ok) {
    return uploaded;
  }
  const deps = getApplicationDeps();
  await deps.organizationSettings.upsertLogoUrl(organizationId, uploaded.url);
  revalidatePath("/company/settings", "layout");
  return { ok: true, logoUrl: uploaded.url };
}

export async function removeOrganizationLogo(): Promise<OrgSettingsActionResult> {
  const organizationId = await requireOrgAdminOrganizationId();
  if (!organizationId) {
    return { ok: false, message: "Accès refusé." };
  }
  const deps = getApplicationDeps();
  await deps.organizationSettings.upsertLogoUrl(organizationId, null);
  revalidatePath("/company/settings", "layout");
  return { ok: true };
}

export async function updateOrganizationEmailSettings(
  raw: z.input<typeof followUpEmailSchema>,
): Promise<OrgSettingsActionResult> {
  const organizationId = await requireOrgAdminOrganizationId();
  if (!organizationId) {
    return { ok: false, message: "Accès refusé." };
  }
  const parsed = followUpEmailSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const deps = getApplicationDeps();
  await deps.organizationSettings.upsertEmailFields(organizationId, {
    emailTone: parsed.data.emailTone,
    emailVouvoiement: parsed.data.emailVouvoiement,
    emailSignature: parsed.data.emailSignature?.trim() || null,
  });
  revalidatePath("/company/settings", "layout");
  return { ok: true };
}

export async function updatePersonalFollowUpEmailSettings(
  raw: z.input<typeof followUpEmailSchema>,
): Promise<OrgSettingsActionResult> {
  const actor = await requireOrgSettingsActor();
  if (!actor || actor.canManageOrganizationSettings) {
    return { ok: false, message: "Accès refusé." };
  }
  const parsed = followUpEmailSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const deps = getApplicationDeps();
  await deps.organizationTeam.upsertMembershipFollowUpEmailPreferences(
    actor.userId,
    actor.organizationId,
    {
      emailTone: parsed.data.emailTone,
      emailVouvoiement: parsed.data.emailVouvoiement,
      emailSignature: parsed.data.emailSignature?.trim() || null,
    },
  );
  revalidatePath("/company/settings", "layout");
  return { ok: true };
}
