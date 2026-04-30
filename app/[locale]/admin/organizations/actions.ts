"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";

type ActionResult = { ok: true } | { ok: false; message: string };

async function requireSuperAdmin(): Promise<
  { ok: true; actorUserId: string } | { ok: false; message: string }
> {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false, message: "Non authentifié." };
  const user = await prisma.user.findUnique({
    where: { id: principal.userId },
    select: { systemRoles: { select: { role: true } } },
  });
  if (!user?.systemRoles.some((r) => r.role === "SUPER_ADMIN")) {
    return { ok: false, message: "Accès réservé aux super administrateurs." };
  }
  return { ok: true, actorUserId: principal.userId };
}

const createOrgSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Le slug est requis.")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des minuscules, chiffres et tirets."),
});

export async function createOrganizationAction(
  raw: z.input<typeof createOrgSchema>,
): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  const parsed = createOrgSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const existing = await prisma.organization.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { ok: false, message: "Ce slug est déjà utilisé." };
  }

  await prisma.organization.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
    },
  });

  await prisma.superAdminAuditLog.create({
    data: {
      actorUserId: gate.actorUserId,
      organizationId: "system",
      action: "CREATE_ORGANIZATION",
      reason: `Créé l'organisation "${parsed.data.name}" (slug: ${parsed.data.slug})`,
    },
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
    .regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des minuscules, chiffres et tirets."),
});

export async function updateOrganizationAction(
  raw: z.input<typeof updateOrgSchema>,
): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  const parsed = updateOrgSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const org = await prisma.organization.findUnique({ where: { id: parsed.data.id } });
  if (!org) return { ok: false, message: "Organisation introuvable." };

  const slugConflict = await prisma.organization.findFirst({
    where: { slug: parsed.data.slug, NOT: { id: parsed.data.id } },
  });
  if (slugConflict) {
    return { ok: false, message: "Ce slug est déjà utilisé par une autre organisation." };
  }

  await prisma.organization.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name, slug: parsed.data.slug },
  });

  await prisma.superAdminAuditLog.create({
    data: {
      actorUserId: gate.actorUserId,
      organizationId: parsed.data.id,
      action: "UPDATE_ORGANIZATION",
      reason: `Mis à jour : "${parsed.data.name}" (slug: ${parsed.data.slug})`,
    },
  });

  revalidatePath("/admin/organizations");
  return { ok: true };
}

export async function bulkDeleteOrganizationsAction(
  ids: string[],
): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  if (ids.length === 0) return { ok: false, message: "Aucun ID fourni." };

  const orgs = await prisma.organization.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, slug: true },
  });

  if (orgs.length === 0) return { ok: false, message: "Aucune organisation trouvée." };

  await prisma.superAdminAuditLog.createMany({
    data: orgs.map((org) => ({
      actorUserId: gate.actorUserId,
      organizationId: org.id,
      action: "DELETE_ORGANIZATION",
      reason: `Supprimé (bulk) l'organisation "${org.name}" (slug: ${org.slug})`,
    })),
  });

  await prisma.organization.deleteMany({ where: { id: { in: ids } } });

  revalidatePath("/admin/organizations");
  return { ok: true };
}

export async function deleteOrganizationAction(
  orgId: string,
): Promise<ActionResult> {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return gate;

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) return { ok: false, message: "Organisation introuvable." };

  await prisma.superAdminAuditLog.create({
    data: {
      actorUserId: gate.actorUserId,
      organizationId: orgId,
      action: "DELETE_ORGANIZATION",
      reason: `Supprimé l'organisation "${org.name}" (slug: ${org.slug})`,
    },
  });

  await prisma.organization.delete({ where: { id: orgId } });

  revalidatePath("/admin/organizations");
  return { ok: true };
}
