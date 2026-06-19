/**
 * Extracts and normalizes the hostname from an email address (e.g. `user@Mail.Acme.com` → `mail.acme.com`).
 */
export function extractEmailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) {
    return null;
  }

  let host = email.slice(at + 1).trim().toLowerCase();
  if (!host) {
    return null;
  }

  if (host.startsWith("www.")) {
    host = host.slice(4);
  }

  return host || null;
}

/**
 * Returns true when the email domain equals or is a subdomain of the org website hostname.
 */
export function emailDomainMatchesOrgWebsite(
  email: string,
  websiteNormalized: string,
): boolean {
  const emailDomain = extractEmailDomain(email);
  if (!emailDomain || !websiteNormalized) {
    return false;
  }

  const website = websiteNormalized.toLowerCase();
  return (
    emailDomain === website || emailDomain.endsWith(`.${website}`)
  );
}
