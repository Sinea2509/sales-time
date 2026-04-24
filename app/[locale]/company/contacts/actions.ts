"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { searchContactsByPrefix } from "@/src/core/application/search-contacts";
import { Prisma } from "@/lib/generated/prisma/client";
import type { ApplicationDeps } from "@/src/adapters/composition";

type RequireOrgContextResult =
  | { ok: false; error: "UNAUTHENTICATED" | "NO_ORG" }
  | {
      ok: true;
      deps: ApplicationDeps;
      organizationId: string;
      principal: { userId: string; email: string };
    };

async function requireOrgContext(): Promise<RequireOrgContextResult> {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) return { ok: false as const, error: "UNAUTHENTICATED" as const };

  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevatedOrganizationId: superAdminOrg },
  );
  if (ctx.kind !== "authenticated" || !ctx.activeOrganizationId) {
    return { ok: false as const, error: "NO_ORG" as const };
  }
  return {
    ok: true as const,
    deps,
    organizationId: ctx.activeOrganizationId,
    principal: { userId: principal.userId, email: principal.email },
  };
}

const contactFields = z.object({
  displayName: z.string().trim().min(1).max(200),
  company: z.string().trim().max(200).optional().nullable(),
  email: z
    .union([z.literal(""), z.string().trim().email()])
    .optional()
    .nullable(),
  phone: z.string().trim().max(80).optional().nullable(),
  jobTitle: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(20_000).optional().nullable(),
});

function emptyToNull(s: string | null | undefined) {
  const t = s?.trim();
  return t ? t : null;
}

export async function searchContactsPickerAction(prefix: string) {
  const gate = await requireOrgContext();
  if (!gate.ok) return { ok: false as const, error: gate.error, items: [] };

  const items = await searchContactsByPrefix(
    { contacts: gate.deps.contacts },
    {
      organizationId: gate.organizationId,
      prefix,
      limit: 10,
    },
  );
  return { ok: true as const, items };
}

export async function createContactInlineAction(raw: {
  displayName: string;
  company?: string | null;
}) {
  const gate = await requireOrgContext();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const parsed = z
    .object({
      displayName: z.string().trim().min(1).max(200),
      company: z.string().trim().max(200).optional().nullable(),
    })
    .safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" as const };
  }

  try {
    const row = await gate.deps.contacts.create({
      organizationId: gate.organizationId,
      displayName: parsed.data.displayName,
      company: emptyToNull(parsed.data.company ?? null),
    });
    revalidatePath("/company/contacts");
    return {
      ok: true as const,
      personId: row.id,
      displayName: row.displayName,
    };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false as const, error: "DUPLICATE" as const };
    }
    throw e;
  }
}

export async function createContactAction(raw: z.input<typeof contactFields>) {
  const gate = await requireOrgContext();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const parsed = contactFields.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" as const };
  }

  const emailRaw = parsed.data.email;
  const email =
    emailRaw == null || emailRaw === "" ? null : emailRaw.trim().toLowerCase();

  try {
    const row = await gate.deps.contacts.create({
      organizationId: gate.organizationId,
      displayName: parsed.data.displayName,
      company: emptyToNull(parsed.data.company ?? null),
      email,
      phone: emptyToNull(parsed.data.phone ?? null),
      jobTitle: emptyToNull(parsed.data.jobTitle ?? null),
      notes: emptyToNull(parsed.data.notes ?? null),
    });
    revalidatePath("/company/contacts");
    return { ok: true as const, id: row.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false as const, error: "DUPLICATE" as const };
    }
    throw e;
  }
}

export async function updateContactAction(
  id: string,
  raw: z.input<typeof contactFields>,
) {
  const gate = await requireOrgContext();
  if (!gate.ok) return { ok: false as const, error: gate.error };

  const idParsed = z.string().cuid().safeParse(id);
  if (!idParsed.success) {
    return { ok: false as const, error: "VALIDATION" as const };
  }

  const parsed = contactFields.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" as const };
  }

  const emailRaw = parsed.data.email;
  const email =
    emailRaw == null || emailRaw === "" ? null : emailRaw.trim().toLowerCase();

  const row = await gate.deps.contacts.update({
    id: idParsed.data,
    organizationId: gate.organizationId,
    patch: {
      displayName: parsed.data.displayName,
      company: emptyToNull(parsed.data.company ?? null),
      email,
      phone: emptyToNull(parsed.data.phone ?? null),
      jobTitle: emptyToNull(parsed.data.jobTitle ?? null),
      notes: emptyToNull(parsed.data.notes ?? null),
    },
  });
  if (!row) return { ok: false as const, error: "NOT_FOUND" as const };

  revalidatePath("/company/contacts");
  revalidatePath(`/company/contacts/${idParsed.data}`);
  return { ok: true as const };
}
