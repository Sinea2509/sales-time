export interface PasswordResetRepositoryPort {
  findActiveUserByEmail(
    email: string,
  ): Promise<{ id: string; email: string } | null>;

  createResetToken(input: {
    userId: string;
    rawToken: string;
    expiresAt: Date;
  }): Promise<void>;

  resetPasswordWithToken(input: {
    rawToken: string;
    passwordHash: string;
  }): Promise<{ ok: true } | { ok: false }>;
}
