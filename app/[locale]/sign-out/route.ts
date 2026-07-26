import {
  clearActiveOrganizationCookie,
  clearSessionCookie,
} from "@/lib/auth/session-cookie";
import { NextResponse } from "next/server";

/**
 * Sign-out must be POST-only. A GET handler used to clear cookies, but
 * `<Link href="/sign-out">` is prefetched by the App Router and would fire GET
 * in the background, logging users out while they navigate.
 */
export async function POST(request: Request) {
  await clearSessionCookie();
  await clearActiveOrganizationCookie();
  return NextResponse.redirect(new URL("/sign-in", request.url));
}
