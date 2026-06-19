"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { setActiveOrganizationCookie } from "@/lib/auth/session-cookie";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import { buildInvitationEmailHtml } from "@/lib/invite-email-html";
import { sanitizeInviteMessageHtml } from "@/lib/invite-message-sanitize";
import { getApplicationDeps } from "@/lib/application-deps";
import type { DomainUser } from "@/src/core/ports/user-repository-port";

async function requireUser(): Promise<DomainUser> {
  const deps = getApplicationDeps();
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
        email: z
          .string()
          .email()
          .transform((e) => e.toLowerCase()),
        role: z.enum(["ADMIN", "MEMBER"]),
      }),
    )
    .max(50),
  inviteMessage: z.string().max(16000).optional().nullable(),
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
  const deps = getApplicationDeps();
  const row = await deps.users.findUserWithOnboardingByUserId(user.id);
  if (!row?.onboardingProfile) {
    return {
      ok: false,
      message:
        "Profil d’onboarding introuvable. Rechargez la page ou reconnectez-vous.",
    };
  }
  const companyName = row.onboardingProfile.companyName?.trim() ?? "";
  if (!companyName) {
    return {
      ok: false,
      message:
        "Le nom de l’entreprise est manquant. Complétez d’abord l’inscription avec le nom de votre entreprise.",
    };
  }
  await deps.onboardingProfiles.updateAfterStep1(user.id, {
    companyName,
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
  const deps = getApplicationDeps();
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
  const deps = getApplicationDeps();
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

  const deduped = new Map<
    string,
    { email: string; role: "ADMIN" | "MEMBER" }
  >();
  for (const row of parsed.data.invites) {
    if (row.email === user.email.toLowerCase()) continue;
    deduped.set(row.email, { email: row.email, role: row.role });
  }

  const deps = getApplicationDeps();
  const inviteMessageRaw = parsed.data.inviteMessage?.trim();
  const inviteMessageSanitized = inviteMessageRaw
    ? sanitizeInviteMessageHtml(inviteMessageRaw)
    : null;

  const result =
    await deps.onboardingCompletion.completeStep4CreateOrganizationAndInvites({
      userId: user.id,
      userEmail: user.email.toLowerCase(),
      inviteMessage: inviteMessageSanitized,
      inviteEmailsJson: parsed.data.invites as object,
      invites: [...deduped.values()],
    });

  if (!result.ok) {
    if (result.error === "PROFILE_INCOMPLETE") {
      return {
        ok: false,
        message: "Complétez d’abord l’étape entreprise (nom de société).",
      };
    }
    if (result.error === "WEBSITE_TAKEN") {
      return {
        ok: false,
        message:
          "Une organisation est déjà enregistrée avec le site web associé à votre compte. Contactez le support si vous pensez qu’il s’agit d’une erreur.",
      };
    }
    if (result.error === "UNIQUE_CONFLICT") {
      return {
        ok: false,
        message:
          "Ce site web est déjà utilisé par une autre organisation. Si vous rejoignez une équipe existante, demandez une invitation plutôt que de créer un espace.",
      };
    }
    return { ok: false, message: "Une erreur est survenue. Réessayez." };
  }

  await setActiveOrganizationCookie(result.organizationId);

  await deps.audit.logPlatformAction({
    actorUserId: user.id,
    organizationId: result.organizationId,
    action: "ORG_CREATED",
    reason: `Organisation « ${result.companyName} » créée à l'onboarding`,
  });

  const orgName = result.companyName;
  for (const m of result.mailPayloads) {
    await sendTransactionalEmail({
      to: m.to,
      subject: `Invitation — ${orgName}`,
      html: buildInvitationEmailHtml({
        organizationName: orgName,
        inviteLink: m.link,
        bodyHtml: inviteMessageSanitized ?? "",
      }),
    });
  }

  redirect("/company");
}
