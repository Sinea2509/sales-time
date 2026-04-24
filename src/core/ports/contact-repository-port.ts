export type ContactSummaryRow = {
  id: string;
  displayName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContactSearchHit = {
  id: string;
  displayName: string;
  company: string | null;
};

export type ContactCreateInput = {
  organizationId: string;
  displayName: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  notes?: string | null;
};

export type ContactUpdatePatch = {
  displayName?: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  notes?: string | null;
};

export interface ContactRepositoryPort {
  searchByPrefix(input: {
    organizationId: string;
    prefix: string;
    limit: number;
  }): Promise<ContactSearchHit[]>;

  findById(input: {
    id: string;
    organizationId: string;
  }): Promise<ContactSummaryRow | null>;

  create(input: ContactCreateInput): Promise<ContactSummaryRow>;

  update(input: {
    id: string;
    organizationId: string;
    patch: ContactUpdatePatch;
  }): Promise<ContactSummaryRow | null>;

  listForOrg(input: {
    organizationId: string;
    search?: string;
    limit: number;
    offset: number;
  }): Promise<ContactSummaryRow[]>;
}
