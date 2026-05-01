/**
 * Best-effort check that the given hostname responds over HTTP(S).
 * Used at sign-up to reject obvious typos or dead domains (false negatives possible).
 */
export async function verifyWebsiteReachable(
  host: string,
): Promise<{ ok: true } | { ok: false }> {
  const urls = [`https://${host}/`, `http://${host}/`];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "User-Agent": "SalesTimeSignup/1.0 (+https://sales-time)",
        },
      });
      if (typeof res.status === "number" && res.status > 0) {
        return { ok: true };
      }
    } catch {
      continue;
    }
  }
  return { ok: false };
}
