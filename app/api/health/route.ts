import { NextResponse } from "next/server";
import { getApplicationDeps } from "@/lib/application-deps";

/**
 * Liveness: always 200 JSON `{ ok: true }`.
 * Optional `?db=1`: runs `SELECT 1`; use to verify DATABASE_URL / migrations on Vercel (no auth).
 */
export async function GET(request: Request) {
  const checkDb = new URL(request.url).searchParams.get("db") === "1";
  if (!checkDb) {
    return NextResponse.json({ ok: true });
  }
  try {
    await getApplicationDeps().platformHealth.pingSelectOne();
    return NextResponse.json({ ok: true, db: true });
  } catch {
    return NextResponse.json(
      { ok: false, db: false, error: "database_unreachable" },
      { status: 503 },
    );
  }
}
