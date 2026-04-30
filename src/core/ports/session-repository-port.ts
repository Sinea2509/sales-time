import type { SessionPrincipal } from "../domain/session-principal";

export interface SessionRepositoryPort {
  createSessionRecord(input: {
    userId: string;
    rawToken: string;
    userAgent?: string | null;
  }): Promise<void>;

  deleteSessionByRawToken(rawToken: string): Promise<void>;

  deleteAllSessionsForUser(userId: string): Promise<void>;

  findSessionPrincipal(rawToken: string): Promise<SessionPrincipal | null>;
}
