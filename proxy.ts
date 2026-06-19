import {
  ACTIVE_ORG_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_VERSION_COOKIE_NAME,
} from "@/lib/auth/constants";
import {
  buildSignInRedirectPath,
  isSessionVersionCurrent,
} from "@/lib/auth/session-version";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length >= 1 &&
    routing.locales.includes(segments[0] as (typeof routing.locales)[number])
  ) {
    const rest = segments.slice(1);
    return rest.length ? `/${rest.join("/")}` : "/";
  }
  return pathname;
}

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  const prefixes = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/invitations",
    "/super-admin-invitations",
    "/sign-out",
    "/api/webhooks",
    "/api/health",
    "/api/worker",
    "/api/cron",
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function buildReturnPath(request: NextRequest, pathForAuth: string): string {
  return `${pathForAuth}${request.nextUrl.search}`;
}

function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete(SESSION_VERSION_COOKIE_NAME);
  response.cookies.delete(ACTIVE_ORG_COOKIE_NAME);
}

function redirectToSignIn(
  request: NextRequest,
  returnPath: string,
  reason?: "new_version",
): NextResponse {
  const signIn = new URL(
    buildSignInRedirectPath(returnPath, reason),
    request.url,
  );
  const response = NextResponse.redirect(signIn);
  clearAuthCookies(response);
  return response;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathForAuth = stripLocalePrefix(pathname);
  const returnPath = buildReturnPath(request, pathForAuth);

  if (!isPublicPath(pathForAuth)) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return redirectToSignIn(request, returnPath);
    }

    const sessionVersion = request.cookies.get(
      SESSION_VERSION_COOKIE_NAME,
    )?.value;
    if (!isSessionVersionCurrent(sessionVersion)) {
      return redirectToSignIn(request, returnPath, "new_version");
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
