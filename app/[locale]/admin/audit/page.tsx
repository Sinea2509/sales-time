import { prisma } from "@/lib/prisma";
import { AdminAuditLog } from "@/components/admin/admin-audit-log";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const logs = await prisma.superAdminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      actorUserId: true,
      actor: {
        select: { email: true, firstName: true, lastName: true },
      },
      organizationId: true,
      action: true,
      reason: true,
      createdAt: true,
    },
  });

  const serialized = logs.map((log) => ({
    id: log.id,
    actorUserId: log.actorUserId,
    actorEmail: log.actor.email,
    actorName:
      log.actor.firstName && log.actor.lastName
        ? `${log.actor.firstName} ${log.actor.lastName}`
        : null,
    organizationId: log.organizationId,
    action: log.action,
    reason: log.reason,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Journal d&apos;audit
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Historique des actions effectuées par les super administrateurs.
        </p>
      </div>
      <AdminAuditLog logs={serialized} />
    </div>
  );
}
