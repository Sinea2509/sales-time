import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { getApplicationDeps } from "@/lib/application-deps";
import { sendWeeklyManagerDigests } from "@/src/core/application/send-weekly-manager-digests";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deps = getApplicationDeps();
  const result = await sendWeeklyManagerDigests(deps, {
    now: new Date(),
    appBaseUrl: getAppBaseUrl(),
  });

  return NextResponse.json({ ok: true, ...result });
}
