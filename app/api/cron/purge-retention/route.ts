import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { getApplicationDeps } from "@/lib/application-deps";
import { purgeRetentionData } from "@/src/core/application/purge-retention-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deps = getApplicationDeps();
  const result = await purgeRetentionData(deps);
  return NextResponse.json({ ok: true, ...result });
}
