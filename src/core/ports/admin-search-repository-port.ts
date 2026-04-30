export type AdminSearchUserHit = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type AdminSearchOrgHit = {
  id: string;
  name: string;
  slug: string | null;
};

export interface AdminSearchRepositoryPort {
  searchUsersAndOrganizations(query: string): Promise<{
    users: AdminSearchUserHit[];
    organizations: AdminSearchOrgHit[];
  }>;
}
