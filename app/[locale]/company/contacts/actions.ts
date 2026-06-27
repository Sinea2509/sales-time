"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgActor } from "@/lib/analysis-server-context";
import { searchContactsByPrefix } from "@/src/core/application/search-contacts";
import { Prisma } from "@/lib/generated/prisma/client";

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
  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false as const, error: actor.error, items: [] };

  const items = await searchContactsByPrefix(
    { contacts: actor.deps.contacts },
    {
      organizationId: actor.organizationId,
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
  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

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
    const row = await actor.deps.contacts.create({
      organizationId: actor.organizationId,
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
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false as const, error: "DUPLICATE" as const };
    }
    throw e;
  }
}

export async function createContactAction(raw: z.input<typeof contactFields>) {
  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const parsed = contactFields.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "VALIDATION" as const };
  }

  const emailRaw = parsed.data.email;
  const email =
    emailRaw == null || emailRaw === "" ? null : emailRaw.trim().toLowerCase();

  try {
    const row = await actor.deps.contacts.create({
      organizationId: actor.organizationId,
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
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false as const, error: "DUPLICATE" as const };
    }
    throw e;
  }
}

export async function updateContactAction(
  id: string,
  raw: z.input<typeof contactFields>,
) {
  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

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

  const row = await actor.deps.contacts.update({
    id: idParsed.data,
    organizationId: actor.organizationId,
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

export async function deleteContactAction(id: string) {
  const actor = await requireOrgActor();
  if (!actor.ok) return { ok: false as const, error: actor.error };

  const idParsed = z.string().cuid().safeParse(id);
  if (!idParsed.success) {
    return { ok: false as const, error: "VALIDATION" as const };
  }

  const result = await actor.deps.contacts.deleteByIdForOrg({
    id: idParsed.data,
    organizationId: actor.organizationId,
  });

  if (result === "not_found") {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }
  if (result === "has_meetings") {
    return { ok: false as const, error: "HAS_MEETINGS" as const };
  }

  revalidatePath("/company/contacts");
  return { ok: true as const };
}
