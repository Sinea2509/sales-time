"use server";
import {
  isOrganizationFeatureId,
  organizationMayHaveFeature,
} from "@/src/core/domain/organization-features";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getApplicationDeps } from "@/lib/application-deps";
import { ensureDemoOrganization } from "@/src/core/application/ensure-demo-organization";
import { requireSuperAdminActor } from "@/src/core/application/require-super-admin";
import type { DemoOrganizationResult } from "@/src/core/ports/demo-tenant-port";

type ActionResult = { ok: true } | { ok: false; message: string };

export type EnsureDemoOrganizationActionResult =
  | { ok: true; demo: DemoOrganizationResult }
  | { ok: false; message: string };

export async function ensureDemoOrganizationAction(): Promise<EnsureDemoOrganizationActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return gate;

  const result = await ensureDemoOrganization(deps, {
    actorUserId: gate.actorUserId,
  });
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/admin/organizations");
  revalidatePath("/admin");
  return { ok: true, demo: result.demo };
}

const createOrgSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Le slug est requis.")
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Le slug ne peut contenir que des minuscules, chiffres et tirets.",
    ),
});

export async function createOrganizationAction(
  raw: z.input<typeof createOrgSchema>,
): Promise<ActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return gate;

  const parsed = createOrgSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const existing = await deps.backoffice.findOrganizationBySlug(
    parsed.data.slug,
  );
  if (existing) {
    return { ok: false, message: "Ce slug est déjà utilisé." };
  }

  await deps.backoffice.createOrganization({
    name: parsed.data.name,
    slug: parsed.data.slug,
  });

  await deps.backoffice.createSuperAdminAuditLog({
    actorUserId: gate.actorUserId,
    organizationId: "system",
    action: "CREATE_ORGANIZATION",
    reason: `Créé l'organisation "${parsed.data.name}" (slug: ${parsed.data.slug})`,
  });

  revalidatePath("/admin/organizations");
  return { ok: true };
}

const updateOrgSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Le nom est requis.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Le slug est requis.")
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      "Le slug ne peut contenir que des minuscules, chiffres et tirets.",
    ),
});

export async function updateOrganizationAction(
  raw: z.input<typeof updateOrgSchema>,
): Promise<ActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return gate;

  const parsed = updateOrgSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const org = await deps.backoffice.findOrganizationById(parsed.data.id);
  if (!org) return { ok: false, message: "Organisation introuvable." };

  const slugConflict = await deps.backoffice.findOrganizationSlugConflict(
    parsed.data.slug,
    parsed.data.id,
  );
  if (slugConflict) {
    return {
      ok: false,
      message: "Ce slug est déjà utilisé par une autre organisation.",
    };
  }

  await deps.backoffice.updateOrganization(parsed.data.id, {
    name: parsed.data.name,
    slug: parsed.data.slug,
  });

  await deps.backoffice.createSuperAdminAuditLog({
    actorUserId: gate.actorUserId,
    organizationId: parsed.data.id,
    action: "UPDATE_ORGANIZATION",
    reason: `Mis à jour : "${parsed.data.name}" (slug: ${parsed.data.slug})`,
  });

  revalidatePath("/admin/organizations");
  return { ok: true };
}

export async function bulkDeleteOrganizationsAction(
  ids: string[],
): Promise<ActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return gate;

  if (ids.length === 0) return { ok: false, message: "Aucun ID fourni." };

  const orgs = await deps.backoffice.findOrganizationsByIds(ids);

  if (orgs.length === 0)
    return { ok: false, message: "Aucune organisation trouvée." };

  await deps.backoffice.createSuperAdminAuditLogsMany(
    orgs.map((org) => ({
      actorUserId: gate.actorUserId,
      organizationId: org.id,
      action: "DELETE_ORGANIZATION",
      reason: `Supprimé (bulk) l'organisation "${org.name}" (slug: ${org.slug})`,
    })),
  );

  await deps.backoffice.deleteOrganizationsByIds(ids);

  revalidatePath("/admin/organizations");
  return { ok: true };
}

export async function deleteOrganizationAction(
  orgId: string,
): Promise<ActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return gate;

  const org = await deps.backoffice.findOrganizationById(orgId);
  if (!org) return { ok: false, message: "Organisation introuvable." };

  await deps.backoffice.createSuperAdminAuditLog({
    actorUserId: gate.actorUserId,
    organizationId: orgId,
    action: "DELETE_ORGANIZATION",
    reason: `Supprimé l'organisation "${org.name}" (slug: ${org.slug})`,
  });

  await deps.backoffice.deleteOrganizationById(orgId);

  revalidatePath("/admin/organizations");
  return { ok: true };
}

const setFeatureSchema = z.object({
  organizationId: z.string().min(1),
  feature: z
    .string()
    .refine(isOrganizationFeatureId, "Fonctionnalité inconnue."),
  enabled: z.boolean(),
});

/** Active ou retire une fonctionnalité réservée pour une organisation. */
export async function setOrganizationFeatureAction(
  raw: z.input<typeof setFeatureSchema>,
): Promise<ActionResult> {
  const deps = getApplicationDeps();
  const gate = await requireSuperAdminActor(deps);
  if (!gate.ok) return gate;

  const parsed = setFeatureSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }
  const { organizationId, feature, enabled } = parsed.data;
  if (!isOrganizationFeatureId(feature)) {
    return { ok: false, message: "Fonctionnalité inconnue." };
  }
  if (enabled && !organizationMayHaveFeature(organizationId, feature)) {
    return { ok: false, message: "Fonctionnalité réservée à Sinéa." };
  }

  const org = await deps.backoffice.findOrganizationById(organizationId);
  if (!org) return { ok: false, message: "Organisation introuvable." };

  await deps.organizationFeatures.setFeature({
    organizationId,
    feature,
    enabled,
  });
  await deps.backoffice.createSuperAdminAuditLog({
    actorUserId: gate.actorUserId,
    organizationId,
    action: "SET_ORGANIZATION_FEATURE",
    reason: `${enabled ? "Activé" : "Retiré"} : ${feature}`,
  });

  revalidatePath(`/admin/organizations/${organizationId}`);
  return { ok: true };
}
