"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { setActiveOrganizationCookie } from "@/lib/auth/session-cookie";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import { uniqueOrganizationSlug } from "@/lib/org-slug";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { makeApplicationDeps } from "@/src/adapters/composition";
import type { DomainUser } from "@/src/core/ports/user-repository-port";

async function requireUser(): Promise<DomainUser> {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    redirect("/sign-in");
  }
  const user = await deps.users.findById(principal.userId);
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

const step1Schema = z.object({
  companyName: z.string().min(1, "Le nom de l’entreprise est requis").max(200),
  industrySector: z.string().max(200).optional().nullable(),
  commercialTeamSize: z.string().max(120).optional().nullable(),
  averageSalesCycle: z.string().max(120).optional().nullable(),
  averageDealSize: z.string().max(120).optional().nullable(),
});

const step2Schema = z.object({
  companyPitch: z.string().max(500).optional().nullable(),
  objections: z.array(z.string().max(300)).max(30),
  keyArguments: z.array(z.string().max(400)).max(30),
  industryVocabulary: z.string().max(500).optional().nullable(),
});

const step3Schema = z.object({
  meetingTypes: z.array(z.string().max(120)).min(1).max(40),
  pipelineStages: z.array(z.string().max(120)).min(1).max(40),
});

const step4Schema = z.object({
  invites: z
    .array(
      z.object({
        email: z.string().email().transform((e) => e.toLowerCase()),
        role: z.enum(["ADMIN", "MEMBER"]),
      }),
    )
    .max(50),
  inviteMessage: z.string().max(2000).optional().nullable(),
});

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function submitOnboardingStep1(
  raw: z.input<typeof step1Schema>,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = step1Schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez les champs du formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }
  const deps = makeApplicationDeps();
  await deps.onboardingProfiles.updateAfterStep1(user.id, {
    companyName: parsed.data.companyName,
    industrySector: parsed.data.industrySector ?? null,
    commercialTeamSize: parsed.data.commercialTeamSize ?? null,
    averageSalesCycle: parsed.data.averageSalesCycle ?? null,
    averageDealSize: parsed.data.averageDealSize ?? null,
  });
  return { ok: true };
}

export async function submitOnboardingStep2(
  raw: z.input<typeof step2Schema>,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = step2Schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez les champs du formulaire.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }
  const deps = makeApplicationDeps();
  await deps.onboardingProfiles.updateAfterStep2(user.id, {
    companyPitch: parsed.data.companyPitch ?? null,
    objections: parsed.data.objections,
    keyArguments: parsed.data.keyArguments,
    industryVocabulary: parsed.data.industryVocabulary ?? null,
  });
  return { ok: true };
}

export async function submitOnboardingStep3(
  raw: z.input<typeof step3Schema>,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = step3Schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Ajoutez au moins un type de RDV et une étape de pipeline.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }
  const deps = makeApplicationDeps();
  await deps.onboardingProfiles.updateAfterStep3(user.id, {
    meetingTypes: parsed.data.meetingTypes,
    pipelineStages: parsed.data.pipelineStages,
  });
  return { ok: true };
}

export async function submitOnboardingStep4(
  raw: z.input<typeof step4Schema>,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = step4Schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Vérifiez les adresses e-mail.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const profile = await prisma.onboardingProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile?.companyName?.trim()) {
    return {
      ok: false,
      message: "Complétez d’abord l’étape entreprise (nom de société).",
    };
  }

  const companyName = profile.companyName.trim();
  const slug = await uniqueOrganizationSlug(prisma, companyName);

  const signupUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { signupWebsiteNormalized: true },
  });
  const websiteKey = signupUser?.signupWebsiteNormalized ?? null;
  if (websiteKey) {
    const taken = await prisma.organization.findUnique({
      where: { websiteNormalized: websiteKey },
    });
    if (taken) {
      return {
        ok: false,
        message:
          "Une organisation est déjà enregistrée avec le site web associé à votre compte. Contactez le support si vous pensez qu’il s’agit d’une erreur.",
      };
    }
  }

  const deduped = new Map<
    string,
    { email: string; role: "ADMIN" | "MEMBER" }
  >();
  for (const row of parsed.data.invites) {
    if (row.email === user.email.toLowerCase()) continue;
    deduped.set(row.email, { email: row.email, role: row.role });
  }

  const mailPayloads: { to: string; link: string }[] = [];

  let orgId: string;
  try {
    orgId = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: companyName,
          slug,
          ...(websiteKey ? { websiteNormalized: websiteKey } : {}),
        },
      });

    await tx.organizationMembership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: "ADMIN",
      },
    });

    await tx.organizationSettings.create({
      data: {
        organizationId: org.id,
        companyName,
        industrySector: profile.industrySector,
        commercialTeamSize: profile.commercialTeamSize,
        averageSalesCycle: profile.averageSalesCycle,
        averageDealSize: profile.averageDealSize,
        companyPitch: profile.companyPitch,
        objections: profile.objections ?? undefined,
        keyArguments: profile.keyArguments ?? undefined,
        industryVocabulary: profile.industryVocabulary,
        meetingTypes: profile.meetingTypes ?? undefined,
        pipelineStages: profile.pipelineStages ?? undefined,
      },
    });

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    for (const inv of deduped.values()) {
      const raw = generateOpaqueToken(32);
      await tx.organizationInvitation.create({
        data: {
          organizationId: org.id,
          email: inv.email,
          role: inv.role,
          tokenHash: hashToken(raw),
          expiresAt,
          invitedByUserId: user.id,
        },
      });
      const base =
        process.env.APP_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
      mailPayloads.push({
        to: inv.email,
        link: `${base}/invitations/${encodeURIComponent(raw)}`,
      });
    }

    await tx.onboardingProfile.update({
      where: { userId: user.id },
      data: {
        inviteEmails: parsed.data.invites as object,
        inviteMessage: parsed.data.inviteMessage,
        completedAt: new Date(),
        currentStep: 4,
      },
    });

      return org.id;
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        ok: false,
        message:
          "Ce site web est déjà utilisé par une autre organisation. Si vous rejoignez une équipe existante, demandez une invitation plutôt que de créer un espace.",
      };
    }
    throw e;
  }

  await setActiveOrganizationCookie(orgId);

  const orgName = companyName;
  for (const m of mailPayloads) {
    await sendTransactionalEmail({
      to: m.to,
      subject: `Invitation — ${orgName}`,
      html: `<p>Vous êtes invité à rejoindre <strong>${orgName}</strong> sur Sales Time.</p><p><a href="${m.link}">Accepter l’invitation</a></p>`,
    });
  }

  redirect("/company");
}
