export function verifyCronSecret(request: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    if (process.env.NODE_ENV !== "production") return true;
    console.error("verifyCronSecret: CRON_SECRET missing in production");
    return false;
  }

  const auth = request.headers.get("authorization");
  const ok = auth === `Bearer ${expected}`;
  if (!ok && process.env.NODE_ENV === "production") {
    console.error("verifyCronSecret: authorization header missing or invalid");
  }
  return ok;
}
