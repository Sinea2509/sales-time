import type { SystemRoleType } from "../domain/system-role-type";

export type DomainUser = {
  id: string;
  clerkUserId: string;
  systemRoles: SystemRoleType[];
};

export interface UserRepositoryPort {
  findByClerkUserId(clerkUserId: string): Promise<DomainUser | null>;
}
