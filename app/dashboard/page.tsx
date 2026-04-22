import { makeApplicationDeps } from "@/src/adapters/composition";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardHomePage() {
  const superAdminOrg = await readSuperAdminOrgCookie();
  const ctx = await getCurrentActorContext(makeApplicationDeps(), {
    superAdminActiveClerkOrgId: superAdminOrg,
  });

  if (ctx.kind !== "authenticated") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Organization context comes from Clerk; super-admin elevation uses a
          secure cookie plus audit logging.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session</CardTitle>
            <CardDescription>Clerk JWT organization claims</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-xs">
            <p>
              <span className="text-muted-foreground">session org:</span>{" "}
              {ctx.sessionClerkOrgId ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">session role:</span>{" "}
              {ctx.sessionClerkOrgRole ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resolved tenant</CardTitle>
            <CardDescription>
              Use this id for org-scoped data access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-mono text-xs">
              {ctx.activeTenantClerkOrgId ?? "—"}
            </p>
            <div className="flex flex-wrap gap-2">
              {ctx.isElevatedSuperAdmin ? (
                <Badge variant="destructive">Elevated super admin</Badge>
              ) : null}
              {ctx.canManageOrganization ? (
                <Badge variant="secondary">Can manage organization</Badge>
              ) : (
                <Badge variant="outline">Read / member</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
