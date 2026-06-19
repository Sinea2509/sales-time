import {
  emailDomainMatchesOrgWebsite,
  extractEmailDomain,
} from "./email-domain-matches-org-website";

describe("extractEmailDomain", () => {
  it("returns normalized hostname from email", () => {
    expect(extractEmailDomain("User@Mail.Acme.com")).toBe("mail.acme.com");
  });

  it("strips www. prefix from email domain", () => {
    expect(extractEmailDomain("a@www.example.com")).toBe("example.com");
  });

  it("returns null for malformed email", () => {
    expect(extractEmailDomain("not-an-email")).toBeNull();
    expect(extractEmailDomain("@nodomain.com")).toBeNull();
    expect(extractEmailDomain("user@")).toBeNull();
  });
});

describe("emailDomainMatchesOrgWebsite", () => {
  it("matches exact hostname", () => {
    expect(emailDomainMatchesOrgWebsite("user@acme.com", "acme.com")).toBe(
      true,
    );
  });

  it("matches subdomain of org website", () => {
    expect(
      emailDomainMatchesOrgWebsite("hire@mail.acme.com", "acme.com"),
    ).toBe(true);
  });

  it("rejects unrelated domains", () => {
    expect(emailDomainMatchesOrgWebsite("user@gmail.com", "acme.com")).toBe(
      false,
    );
    expect(emailDomainMatchesOrgWebsite("user@notacme.com", "acme.com")).toBe(
      false,
    );
  });

  it("rejects when email domain is parent of website", () => {
    expect(emailDomainMatchesOrgWebsite("user@acme.com", "mail.acme.com")).toBe(
      false,
    );
  });

  it("returns false for malformed email", () => {
    expect(emailDomainMatchesOrgWebsite("invalid", "acme.com")).toBe(false);
  });
});
