import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_INVITE_MESSAGE,
  DEFAULT_MEETING_TYPES,
  DEFAULT_PIPELINE_STAGES,
} from "@/lib/onboarding-defaults";
import { ensureClerkUserSynced } from "@/src/adapters/prisma/sync-clerk-user";

export const dynamic = "force-dynamic";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  await ensureClerkUserSynced(userId);

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { onboardingProfile: true },
  });

  if (!user) {
    redirect("/sign-in");
  }

  if (user.onboardingProfile?.completedAt) {
    redirect("/dashboard");
  }

  const p = user.onboardingProfile;

  const initial = {
    currentStep: Math.min(Math.max(p?.currentStep ?? 1, 1), 4),
    companyName: p?.companyName ?? "",
    industrySector: p?.industrySector ?? "",
    commercialTeamSize: p?.commercialTeamSize ?? "",
    averageSalesCycle: p?.averageSalesCycle ?? "",
    averageDealSize: p?.averageDealSize ?? "",
    companyPitch: p?.companyPitch ?? "",
    objections: asStringArray(p?.objections),
    keyArguments: asStringArray(p?.keyArguments),
    industryVocabulary: p?.industryVocabulary ?? "",
    meetingTypes:
      asStringArray(p?.meetingTypes).length > 0
        ? asStringArray(p?.meetingTypes)
        : [...DEFAULT_MEETING_TYPES],
    pipelineStages:
      asStringArray(p?.pipelineStages).length > 0
        ? asStringArray(p?.pipelineStages)
        : [...DEFAULT_PIPELINE_STAGES],
    inviteEmails: asStringArray(p?.inviteEmails),
    inviteMessage: p?.inviteMessage ?? DEFAULT_INVITE_MESSAGE,
  };

  return <OnboardingWizard initial={initial} />;
}
