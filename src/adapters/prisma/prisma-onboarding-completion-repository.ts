import type { PrismaClient } from "@/lib/generated/prisma/client";
import { Prisma } from "@/lib/generated/prisma/client";
import { generateOpaqueToken, hashToken } from "@/lib/auth/tokens";
import { uniqueOrganizationSlug } from "@/lib/org-slug";
import type {
  CompleteOnboardingStep4Input,
  CompleteOnboardingStep4Result,
  OnboardingCompletionRepositoryPort,
} from "@/src/core/ports/onboarding-completion-repository-port";

export class PrismaOnboardingCompletionRepository implements OnboardingCompletionRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async completeStep4CreateOrganizationAndInvites(
    input: CompleteOnboardingStep4Input,
  ): Promise<CompleteOnboardingStep4Result> {
    const profile = await this.db.onboardingProfile.findUnique({
      where: { userId: input.userId },
    });
    if (!profile?.companyName?.trim()) {
      return { ok: false, error: "PROFILE_INCOMPLETE" };
    }

    const companyName = profile.companyName.trim();
    const slug = await uniqueOrganizationSlug(this.db, companyName);

    const signupUser = await this.db.user.findUnique({
      where: { id: input.userId },
      select: { signupWebsiteNormalized: true },
    });
    const websiteKey = signupUser?.signupWebsiteNormalized ?? null;
    if (websiteKey) {
      const taken = await this.db.organization.findUnique({
        where: { websiteNormalized: websiteKey },
      });
      if (taken) {
        return { ok: false, error: "WEBSITE_TAKEN" };
      }
    }

    const mailPayloads: { to: string; link: string }[] = [];

    try {
      const orgId = await this.db.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: companyName,
            slug,
            ...(websiteKey ? { websiteNormalized: websiteKey } : {}),
          },
        });

        await tx.organizationMembership.create({
          data: {
            userId: input.userId,
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
        for (const inv of input.invites) {
          const raw = generateOpaqueToken(32);
          await tx.organizationInvitation.create({
            data: {
              organizationId: org.id,
              email: inv.email,
              role: inv.role,
              tokenHash: hashToken(raw),
              expiresAt,
              invitedByUserId: input.userId,
            },
          });
          const base =
            process.env.APP_BASE_URL?.replace(/\/$/, "") ??
            "http://localhost:3000";
          mailPayloads.push({
            to: inv.email,
            link: `${base}/invitations/${encodeURIComponent(raw)}`,
          });
        }

        await tx.onboardingProfile.update({
          where: { userId: input.userId },
          data: {
            inviteEmails: input.inviteEmailsJson as object,
            inviteMessage: input.inviteMessage,
            completedAt: new Date(),
            currentStep: 4,
          },
        });

        return org.id;
      });

      return {
        ok: true,
        organizationId: orgId,
        companyName,
        mailPayloads,
      };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        return { ok: false, error: "UNIQUE_CONFLICT" };
      }
      throw e;
    }
  }
}
