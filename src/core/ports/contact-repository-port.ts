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
  /** Qui crée le contact : un commercial retrouve ainsi ceux qu'il n'a pas encore rencontrés. */
  createdByUserId?: string | null;
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

export type ProspectCompanyAliasRow = {
  displayName: string;
  company: string | null;
};

/**
 * `visibleTo` restreint aux contacts créés ou déjà rencontrés par ce
 * commercial ; absent, tous les contacts de l'organisation sont lus (voir
 * `contactsVisibleTo`).
 */
export interface ContactRepositoryPort {
  searchByPrefix(input: {
    organizationId: string;
    prefix: string;
    limit: number;
    visibleTo?: string;
  }): Promise<ContactSearchHit[]>;

  /** Returns the contact when exactly one has this company name (case-insensitive). */
  findUniqueByCompanyName(input: {
    organizationId: string;
    companyName: string;
    visibleTo?: string;
  }): Promise<ContactSearchHit | null>;

  /**
   * Maps person ids whose displayName equals another contact's company
   * to that canonical contact (skipped when ambiguous).
   */
  findProspectCompanyAliasByPersonId(input: {
    organizationId: string;
    visibleTo?: string;
  }): Promise<Map<string, ProspectCompanyAliasRow>>;

  findById(input: {
    id: string;
    organizationId: string;
    visibleTo?: string;
  }): Promise<ContactSummaryRow | null>;

  create(input: ContactCreateInput): Promise<ContactSummaryRow>;

  update(input: {
    id: string;
    organizationId: string;
    patch: ContactUpdatePatch;
  }): Promise<ContactSummaryRow | null>;

  deleteByIdForOrg(input: {
    id: string;
    organizationId: string;
  }): Promise<"deleted" | "not_found" | "has_meetings">;

  listForOrg(input: {
    organizationId: string;
    search?: string;
    limit: number;
    offset: number;
    visibleTo?: string;
  }): Promise<ContactSummaryRow[]>;
}
