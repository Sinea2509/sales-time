import { describe, expect, it } from "@jest/globals";
import { resolveMeetingPersonLink } from "./resolve-meeting-person-link";

describe("resolveMeetingPersonLink", () => {
  it("keeps explicit personId unchanged", async () => {
    const contacts = {
      findUniqueByCompanyName: jest.fn(),
    };
    const result = await resolveMeetingPersonLink(contacts as never, {
      organizationId: "org_1",
      personId: "person_1",
      prospectName: "Doha",
    });
    expect(result).toEqual({
      personId: "person_1",
      prospectName: "Doha",
    });
    expect(contacts.findUniqueByCompanyName).not.toHaveBeenCalled();
  });

  it("links to contact when prospect name matches a unique company", async () => {
    const contacts = {
      findUniqueByCompanyName: jest.fn().mockResolvedValue({
        id: "person_margaux",
        displayName: "Margaux JULIEN",
        company: "Doha",
      }),
    };
    const result = await resolveMeetingPersonLink(contacts as never, {
      organizationId: "org_1",
      personId: null,
      prospectName: " Doha ",
    });
    expect(result).toEqual({
      personId: "person_margaux",
      prospectName: "Margaux JULIEN",
    });
    expect(contacts.findUniqueByCompanyName).toHaveBeenCalledWith({
      organizationId: "org_1",
      companyName: "Doha",
    });
  });

  it("creates new contact path when no company match", async () => {
    const contacts = {
      findUniqueByCompanyName: jest.fn().mockResolvedValue(null),
    };
    const result = await resolveMeetingPersonLink(contacts as never, {
      organizationId: "org_1",
      personId: null,
      prospectName: "New Prospect",
    });
    expect(result).toEqual({
      personId: null,
      prospectName: "New Prospect",
    });
  });
});
