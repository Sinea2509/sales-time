/**
 * Normalizes a user-entered website to a single canonical hostname used as a
 * unique org key (e.g. `HTTPS://WWW.Example.com/foo` → `example.com`).
 */
export type NormalizeWebsiteResult =
  | { ok: true; value: string }
  | { ok: false; error: "EMPTY" | "INVALID" };

export function tryNormalizeWebsiteForOrgKey(
  raw: string,
): NormalizeWebsiteResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "EMPTY" };
  }

  let urlString = trimmed;
  if (!/^https?:\/\//i.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { ok: false, error: "INVALID" };
  }

  let host = url.hostname.toLowerCase();
  if (host.startsWith("www.")) {
    host = host.slice(4);
  }

  if (!host) {
    return { ok: false, error: "INVALID" };
  }

  return { ok: true, value: host };
}
