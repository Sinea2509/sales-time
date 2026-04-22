import { cookies } from "next/headers";
import { SUPER_ADMIN_ORG_COOKIE } from "@/lib/super-admin-cookie";

export async function readSuperAdminOrgCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SUPER_ADMIN_ORG_COOKIE)?.value ?? null;
}
