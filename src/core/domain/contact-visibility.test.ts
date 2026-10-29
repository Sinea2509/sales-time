import { contactsVisibleTo } from "./contact-visibility";

describe("contactsVisibleTo", () => {
  it("ne restreint rien pour un manager", () => {
    expect(
      contactsVisibleTo({ internalUserId: "u1", canManageOrganization: true }),
    ).toBeUndefined();
  });

  it("restreint un commercial à ses propres contacts", () => {
    expect(
      contactsVisibleTo({ internalUserId: "u2", canManageOrganization: false }),
    ).toBe("u2");
  });

  it("ne montre rien à un commercial sans identifiant", () => {
    expect(
      contactsVisibleTo({ internalUserId: null, canManageOrganization: false }),
    ).toBe("");
  });
});
