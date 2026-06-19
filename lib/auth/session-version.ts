/** Deployment identity used to invalidate sessions after a new release. */
export function getAuthSessionVersion(): string {
  return (
    process.env.AUTH_SESSION_VERSION?.trim() ||
    process.env.NEXT_PUBLIC_COMMIT_SHA?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    "dev"
  );
}

export function isSessionVersionCurrent(
  storedVersion: string | undefined,
): boolean {
  if (!storedVersion) return false;
  return storedVersion === getAuthSessionVersion();
}

export function buildSignInRedirectPath(
  returnPath: string,
  reason?: "new_version",
): string {
  const params = new URLSearchParams();
  if (returnPath.length > 0) {
    params.set("next", returnPath);
  }
  if (reason) {
    params.set("reason", reason);
  }
  const query = params.toString();
  return query.length > 0 ? `/sign-in?${query}` : "/sign-in";
}
