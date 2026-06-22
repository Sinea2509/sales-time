import { describe, expect, it } from "@jest/globals";
import {
  excludeProspectCompanyAliasContacts,
  resolveProspectListDisplay,
} from "./prospect-list-identity";

describe("resolveProspectListDisplay", () => {
  it("shows contact name and company when both differ", () => {
    expect(
      resolveProspectListDisplay({
        personDisplayName: "Margaux JULIEN",
        personCompany: "Doha",
      }),
    ).toEqual({
      displayName: "Margaux JULIEN",
      company: "Doha",
    });
  });

  it("maps company-only displayName to canonical contact via alias", () => {
    expect(
      resolveProspectListDisplay({
        personDisplayName: "Doha",
        personCompany: null,
        companyAlias: {
          displayName: "Margaux JULIEN",
          company: "Doha",
        },
      }),
    ).toEqual({
      displayName: "Margaux JULIEN",
      company: "Doha",
    });
  });

  it("hides redundant company line when it equals displayName", () => {
    expect(
      resolveProspectListDisplay({
        personDisplayName: "Acme",
        personCompany: "Acme",
      }),
    ).toEqual({
      displayName: "Acme",
      company: null,
    });
  });
});

describe("excludeProspectCompanyAliasContacts", () => {
  it("removes company-only persons that map to a canonical contact", () => {
    const aliases = new Map([
      ["doha-id", { displayName: "Margaux JULIEN", company: "Doha" }],
    ]);
    const rows = [
      { id: "doha-id", displayName: "Doha" },
      { id: "margaux-id", displayName: "Margaux JULIEN", company: "Doha" },
      { id: "sesamers-id", displayName: "Sesamers" },
    ];
    expect(excludeProspectCompanyAliasContacts(rows, aliases)).toEqual([
      { id: "margaux-id", displayName: "Margaux JULIEN", company: "Doha" },
      { id: "sesamers-id", displayName: "Sesamers" },
    ]);
  });

  it("returns all rows when there are no aliases", () => {
    const rows = [{ id: "a", displayName: "Alice" }];
    expect(excludeProspectCompanyAliasContacts(rows, new Map())).toEqual(rows);
  });
});
