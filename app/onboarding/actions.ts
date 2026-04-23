"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function requireUser() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

async function getOrCreateProfile(userId: string) {
  return prisma.onboardingProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
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
        email: z.string().email(),
        role: z.enum(["org:admin", "org:member"]),
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
  const profile = await getOrCreateProfile(user.id);
  await prisma.onboardingProfile.update({
    where: { id: profile.id },
    data: {
      companyName: parsed.data.companyName,
      industrySector: parsed.data.industrySector ?? null,
      commercialTeamSize: parsed.data.commercialTeamSize ?? null,
      averageSalesCycle: parsed.data.averageSalesCycle ?? null,
      averageDealSize: parsed.data.averageDealSize ?? null,
      currentStep: Math.max(profile.currentStep, 2),
    },
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
  const profile = await getOrCreateProfile(user.id);
  await prisma.onboardingProfile.update({
    where: { id: profile.id },
    data: {
      companyPitch: parsed.data.companyPitch ?? null,
      objections: parsed.data.objections,
      keyArguments: parsed.data.keyArguments,
      industryVocabulary: parsed.data.industryVocabulary ?? null,
      currentStep: Math.max(profile.currentStep, 3),
    },
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
  const profile = await getOrCreateProfile(user.id);
  await prisma.onboardingProfile.update({
    where: { id: profile.id },
    data: {
      meetingTypes: parsed.data.meetingTypes,
      pipelineStages: parsed.data.pipelineStages,
      currentStep: Math.max(profile.currentStep, 4),
    },
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
  const profile = await getOrCreateProfile(user.id);
  await prisma.onboardingProfile.update({
    where: { id: profile.id },
    data: {
      inviteEmails: parsed.data.invites,
      inviteMessage: parsed.data.inviteMessage ?? null,
      currentStep: 4,
      completedAt: new Date(),
    },
  });
  redirect("/dashboard");
}
