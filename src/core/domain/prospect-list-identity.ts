import { normalizePersonDisplayKey } from "@/src/core/domain/person-normalize";

export type ProspectListDisplay = {
  displayName: string;
  company: string | null;
};

/** Canonical contact shown when a person was created with a company name as displayName. */
export type ProspectCompanyAlias = {
  displayName: string;
  company: string | null;
};

/**
 * Resolves how a meeting prospect should appear in list views.
 * When a contact exists whose company equals another person's displayName,
 * the canonical contact name is shown instead of the mistaken company-only label.
 */
export function resolveProspectListDisplay(input: {
  personDisplayName: string;
  personCompany: string | null;
  companyAlias?: ProspectCompanyAlias | null;
}): ProspectListDisplay {
  const alias = input.companyAlias;
  if (
    alias &&
    normalizePersonDisplayKey(input.personDisplayName) ===
      normalizePersonDisplayKey(alias.company ?? "")
  ) {
    return prospectListDisplayFromPerson(alias.displayName, alias.company);
  }
  return prospectListDisplayFromPerson(
    input.personDisplayName,
    input.personCompany,
  );
}

/** Hides company-name-only persons when a canonical contact exists for that company. */
export function excludeProspectCompanyAliasContacts<T extends { id: string }>(
  rows: readonly T[],
  companyAliasByPersonId: ReadonlyMap<string, unknown>,
): T[] {
  if (companyAliasByPersonId.size === 0) return [...rows];
  return rows.filter((row) => !companyAliasByPersonId.has(row.id));
}

function prospectListDisplayFromPerson(
  displayName: string,
  company: string | null,
): ProspectListDisplay {
  const name = displayName.trim();
  const companyTrimmed = company?.trim() || null;
  if (
    companyTrimmed &&
    normalizePersonDisplayKey(companyTrimmed) !==
      normalizePersonDisplayKey(name)
  ) {
    return { displayName: name, company: companyTrimmed };
  }
  return { displayName: name, company: null };
}
