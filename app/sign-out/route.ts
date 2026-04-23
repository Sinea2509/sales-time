import { clearActiveOrganizationCookie, clearSessionCookie } from "@/lib/auth/session-cookie";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  await clearSessionCookie();
  await clearActiveOrganizationCookie();
  return NextResponse.redirect(new URL("/sign-in", request.url));
}
