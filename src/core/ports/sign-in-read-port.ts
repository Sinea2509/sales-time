export type SignInUserLookup = {
  id: string;
  passwordHash: string;
  status: "ACTIVE" | "DISABLED";
  isSuperAdmin: boolean;
  organizationMembershipCount: number;
};

export interface SignInReadPort {
  findUserForPasswordSignIn(email: string): Promise<SignInUserLookup | null>;
}
