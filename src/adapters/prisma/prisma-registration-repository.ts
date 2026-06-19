import type { PrismaClient } from "@/lib/generated/prisma/client";
import { Prisma } from "@/lib/generated/prisma/client";
import { hashToken } from "@/lib/auth/tokens";
import { emailDomainMatchesOrgWebsite } from "@/src/core/domain/email-domain-matches-org-website";
import type {
  RegisterFromOrganizationInvitationInput,
  RegisterFromOrganizationInvitationResult,
  RegisterNewUserInput,
  RegisterNewUserResult,
  RegistrationRepositoryPort,
} from "@/src/core/ports/registration-repository-port";

type OrgWithSettings = {
  id: string;
  name: string;
  settings: {
    companyName: string | null;
    industrySector: string | null;
    commercialTeamSize: string | null;
    averageSalesCycle: string | null;
    averageDealSize: string | null;
    companyPitch: string | null;
    objections: Prisma.JsonValue;
    keyArguments: Prisma.JsonValue;
    industryVocabulary: string | null;
    meetingTypes: Prisma.JsonValue;
    pipelineStages: Prisma.JsonValue;
  } | null;
};

function buildOnboardingProfileFromOrgSettings(
  org: OrgWithSettings,
  userId: string,
) {
  const settings = org.settings;
  return {
    userId,
    companyName: settings?.companyName ?? org.name,
    industrySector: settings?.industrySector ?? null,
    commercialTeamSize: settings?.commercialTeamSize ?? null,
    averageSalesCycle: settings?.averageSalesCycle ?? null,
    averageDealSize: settings?.averageDealSize ?? null,
    companyPitch: settings?.companyPitch ?? null,
    objections: settings?.objections ?? undefined,
    keyArguments: settings?.keyArguments ?? undefined,
    industryVocabulary: settings?.industryVocabulary ?? null,
    meetingTypes: settings?.meetingTypes ?? undefined,
    pipelineStages: settings?.pipelineStages ?? undefined,
    completedAt: new Date(),
    currentStep: 4,
  };
}

export class PrismaRegistrationRepository implements RegistrationRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async registerNewUser(
    input: RegisterNewUserInput,
  ): Promise<RegisterNewUserResult> {
    const existing = await this.db.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      return { ok: false, error: "EMAIL_TAKEN" };
    }

    if (
      !emailDomainMatchesOrgWebsite(
        input.email,
        input.signupWebsiteNormalized,
      )
    ) {
      return { ok: false, error: "EMAIL_DOMAIN_MISMATCH" };
    }

    const existingOrg = await this.db.organization.findUnique({
      where: { websiteNormalized: input.signupWebsiteNormalized },
      include: { settings: true },
    });

    if (existingOrg) {
      try {
        const { userId, organizationId } = await this.db.$transaction(
          async (tx) => {
            const user = await tx.user.create({
              data: {
                email: input.email,
                passwordHash: input.passwordHash,
                signupWebsiteNormalized: null,
                firstName: input.firstName,
                lastName: input.lastName,
                profileRole: input.profileRole,
                registerProfileCompletedAt: new Date(),
              },
            });

            await tx.onboardingProfile.create({
              data: buildOnboardingProfileFromOrgSettings(existingOrg, user.id),
            });

            await tx.organizationMembership.create({
              data: {
                userId: user.id,
                organizationId: existingOrg.id,
                role: "MEMBER",
              },
            });

            return { userId: user.id, organizationId: existingOrg.id };
          },
        );

        return {
          ok: true,
          userId,
          organizationId,
          flow: "join_existing_organization",
        };
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          return { ok: false, error: "EMAIL_TAKEN" };
        }
        throw e;
      }
    }

    const user = await this.db.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        signupWebsiteNormalized: input.signupWebsiteNormalized,
        firstName: input.firstName,
        lastName: input.lastName,
        profileRole: input.profileRole,
        registerProfileCompletedAt: new Date(),
      },
    });

    await this.db.onboardingProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        companyName: input.companyName,
      },
      update: { companyName: input.companyName },
    });

    return { ok: true, userId: user.id, flow: "new_organization" };
  }

  async registerFromOrganizationInvitation(
    input: RegisterFromOrganizationInvitationInput,
  ): Promise<RegisterFromOrganizationInvitationResult> {
    const th = hashToken(input.tokenPlaintext);
    const inv = await this.db.organizationInvitation.findFirst({
      where: {
        tokenHash: th,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        organization: {
          include: { settings: true },
        },
      },
    });
    if (!inv) {
      return { ok: false, error: "INVALID" };
    }

    const emailLower = inv.email.toLowerCase();
    const taken = await this.db.user.findUnique({
      where: { email: emailLower },
    });
    if (taken) {
      return { ok: false, error: "EMAIL_TAKEN" };
    }

    const org = inv.organization;

    try {
      const { userId, organizationId } = await this.db.$transaction(
        async (tx) => {
          const user = await tx.user.create({
            data: {
              email: emailLower,
              passwordHash: input.passwordHash,
              signupWebsiteNormalized: null,
              firstName: input.firstName,
              lastName: input.lastName,
              profileRole: null,
              registerProfileCompletedAt: new Date(),
            },
          });

          await tx.onboardingProfile.create({
            data: buildOnboardingProfileFromOrgSettings(org, user.id),
          });

          await tx.organizationMembership.upsert({
            where: {
              userId_organizationId: {
                userId: user.id,
                organizationId: inv.organizationId,
              },
            },
            create: {
              userId: user.id,
              organizationId: inv.organizationId,
              role: inv.role,
            },
            update: { role: inv.role },
          });

          await tx.organizationInvitation.update({
            where: { id: inv.id },
            data: {
              status: "ACCEPTED",
              acceptedByUserId: user.id,
            },
          });

          return { userId: user.id, organizationId: inv.organizationId };
        },
      );

      return { ok: true, userId, organizationId };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        return { ok: false, error: "EMAIL_TAKEN" };
      }
      throw e;
    }
  }
}
