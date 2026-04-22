export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string | null;
};

export interface OrganizationDirectoryPort {
  listOrganizations(input: { limit: number }): Promise<OrganizationSummary[]>;
}
