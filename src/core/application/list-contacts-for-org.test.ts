import { describe, expect, it, jest } from "@jest/globals";
import type { ContactRepositoryPort } from "@/src/core/ports/contact-repository-port";
import { listContactsForOrg } from "./list-contacts-for-org";

const baseContact = {
  email: null,
  phone: null,
  jobTitle: null,
  notes: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("listContactsForOrg", () => {
  it("excludes company-only alias persons from the contact list", async () => {
    const contacts = {
      listForOrg: jest
        .fn<ContactRepositoryPort["listForOrg"]>()
        .mockResolvedValue([
          { id: "doha", displayName: "Doha", company: null, ...baseContact },
          {
            id: "margaux",
            displayName: "Margaux JULIEN",
            company: "Doha",
            ...baseContact,
          },
        ]),
      findProspectCompanyAliasByPersonId: jest
        .fn<ContactRepositoryPort["findProspectCompanyAliasByPersonId"]>()
        .mockResolvedValue(
          new Map([
            ["doha", { displayName: "Margaux JULIEN", company: "Doha" }],
          ]),
        ),
    } as Pick<
      ContactRepositoryPort,
      "listForOrg" | "findProspectCompanyAliasByPersonId"
    >;

    const rows = await listContactsForOrg(
      { contacts: contacts as ContactRepositoryPort },
      { organizationId: "org-1", limit: 200, offset: 0 },
    );

    expect(rows).toEqual([
      {
        id: "margaux",
        displayName: "Margaux JULIEN",
        company: "Doha",
        ...baseContact,
      },
    ]);
    expect(contacts.listForOrg).toHaveBeenCalledWith({
      organizationId: "org-1",
      limit: 200,
      offset: 0,
    });
  });

  it("groups by company within the seller's own contacts only", async () => {
    const contacts = {
      listForOrg: jest
        .fn<ContactRepositoryPort["listForOrg"]>()
        .mockResolvedValue([
          { id: "doha", displayName: "Doha", company: null, ...baseContact },
        ]),
      findProspectCompanyAliasByPersonId: jest
        .fn<ContactRepositoryPort["findProspectCompanyAliasByPersonId"]>()
        .mockResolvedValue(new Map()),
    } as Pick<
      ContactRepositoryPort,
      "listForOrg" | "findProspectCompanyAliasByPersonId"
    >;

    const rows = await listContactsForOrg(
      { contacts: contacts as ContactRepositoryPort },
      { organizationId: "org-1", limit: 200, offset: 0, visibleTo: "user-1" },
    );

    expect(rows.map((r) => r.id)).toEqual(["doha"]);
    expect(contacts.findProspectCompanyAliasByPersonId).toHaveBeenCalledWith({
      organizationId: "org-1",
      visibleTo: "user-1",
    });
  });
});
