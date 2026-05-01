export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string | null;
  /** From org settings when set (e.g. Vercel Blob). */
  logoUrl: string | null;
};

export interface OrganizationDirectoryPort {
  listOrganizations(input: { limit: number }): Promise<OrganizationSummary[]>;

  getOrganizationById(id: string): Promise<OrganizationSummary | null>;
}
