export type RegisterNewUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  signupWebsiteNormalized: string;
};

export type RegisterNewUserResult =
  | { ok: true; userId: string }
  | { ok: false; error: "EMAIL_TAKEN" | "WEBSITE_TAKEN" };

export interface RegistrationRepositoryPort {
  registerNewUser(input: RegisterNewUserInput): Promise<RegisterNewUserResult>;
}
