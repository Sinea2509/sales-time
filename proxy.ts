import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
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
    "/sign-out",
    "/api/webhooks",
    "/api/health",
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathForAuth = stripLocalePrefix(pathname);
  if (!isPublicPath(pathForAuth)) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      const signIn = new URL("/sign-in", request.url);
      signIn.searchParams.set(
        "next",
        `${pathForAuth}${request.nextUrl.search}`,
      );
      return NextResponse.redirect(signIn);
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
