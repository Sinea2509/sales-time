import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/organisms/onboarding-wizard";
import { coerceStoredInviteMessageToHtml } from "@/lib/invite-email-html";
import {
  DEFAULT_MEETING_TYPES,
  DEFAULT_PIPELINE_STAGES,
} from "@/lib/onboarding-defaults";
import {
  initialInviteRowsFromStored,
  parseStoredInviteRows,
} from "@/lib/onboarding-invites";
import { needsRegisterProfile } from "@/lib/register-profile-gate";
import { getApplicationDeps } from "@/lib/application-deps";

export const dynamic = "force-dynamic";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export default async function OnboardingPage() {
  const deps = getApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    redirect("/sign-in");
  }

  const user = await deps.users.findUserWithOnboardingByUserId(
    principal.userId,
  );

  if (!user) {
    redirect("/sign-in");
  }

  if (needsRegisterProfile(user)) {
    redirect("/register/profile");
  }

  if (user.onboardingProfile?.completedAt) {
    redirect("/company");
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
    invites: initialInviteRowsFromStored(parseStoredInviteRows(p?.inviteEmails)),
    inviteMessage: coerceStoredInviteMessageToHtml(p?.inviteMessage),
  };

  return <OnboardingWizard initial={initial} />;
}
