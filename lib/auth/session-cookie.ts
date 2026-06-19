import { cookies } from "next/headers";
import {
  ACTIVE_ORG_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SEC,
  SESSION_VERSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import { getAuthSessionVersion } from "@/lib/auth/session-version";

/** Production normally uses Secure cookies (HTTPS). Set ALLOW_INSECURE_SESSION_COOKIES=1 for local `next start` over http. */
export function shouldUseSecureSessionCookies(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const allowInsecure =
    process.env.ALLOW_INSECURE_SESSION_COOKIES === "1" ||
    process.env.ALLOW_INSECURE_SESSION_COOKIES === "true";
  return !allowInsecure;
}

export async function getSessionTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const v = jar.get(SESSION_COOKIE_NAME)?.value;
  return v && v.length > 0 ? v : null;
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: shouldUseSecureSessionCookies(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export async function setSessionCookie(rawToken: string): Promise<void> {
  const jar = await cookies();
  const options = sessionCookieOptions();
  jar.set(SESSION_COOKIE_NAME, rawToken, options);
  jar.set(SESSION_VERSION_COOKIE_NAME, getAuthSessionVersion(), options);
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE_NAME);
  jar.delete(SESSION_VERSION_COOKIE_NAME);
}

export async function getActiveOrganizationIdFromCookies(): Promise<
  string | null
> {
  const jar = await cookies();
  const v = jar.get(ACTIVE_ORG_COOKIE_NAME)?.value;
  return v && v.length > 0 ? v : null;
}

export async function setActiveOrganizationCookie(
  organizationId: string,
): Promise<void> {
  const jar = await cookies();
  jar.set(ACTIVE_ORG_COOKIE_NAME, organizationId, {
    httpOnly: true,
    secure: shouldUseSecureSessionCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function clearActiveOrganizationCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACTIVE_ORG_COOKIE_NAME);
}
