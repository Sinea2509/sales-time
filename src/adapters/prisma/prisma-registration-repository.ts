import type { PrismaClient } from "@/lib/generated/prisma/client";
import type {
  RegisterNewUserInput,
  RegisterNewUserResult,
  RegistrationRepositoryPort,
} from "@/src/core/ports/registration-repository-port";

export class PrismaRegistrationRepository implements RegistrationRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async registerNewUser(
    input: RegisterNewUserInput,
  ): Promise<RegisterNewUserResult> {
    const existingOrg = await this.db.organization.findUnique({
      where: { websiteNormalized: input.signupWebsiteNormalized },
    });
    if (existingOrg) {
      return { ok: false, error: "WEBSITE_TAKEN" };
    }

    const existing = await this.db.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      return { ok: false, error: "EMAIL_TAKEN" };
    }

    const user = await this.db.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        signupWebsiteNormalized: input.signupWebsiteNormalized,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });

    return { ok: true, userId: user.id };
  }
}
