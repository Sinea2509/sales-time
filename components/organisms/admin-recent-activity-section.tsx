type AdminRecentUserRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  status: string;
  createdAt: Date;
};

type AdminRecentOrgRow = {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  meetingCount: number;
  createdAt: Date;
};

type AdminRecentActivitySectionProps = {
  recentUsers: AdminRecentUserRow[];
  recentOrgs: AdminRecentOrgRow[];
};

export function AdminRecentActivitySection({
  recentUsers,
  recentOrgs,
}: AdminRecentActivitySectionProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-border px-5 py-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold">
            Derniers utilisateurs inscrits
          </h3>
        </div>
        <div className="divide-y divide-border dark:divide-zinc-800">
          {recentUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground dark:text-zinc-100">
                  {u.firstName && u.lastName
                    ? `${u.firstName} ${u.lastName}`
                    : u.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={
                    u.status === "ACTIVE"
                      ? "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
                  }
                >
                  {u.status === "ACTIVE" ? "Actif" : "Bloqué"}
                </span>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {u.createdAt.toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-border px-5 py-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold">Dernières organisations</h3>
        </div>
        <div className="divide-y divide-border dark:divide-zinc-800">
          {recentOrgs.map((org) => (
            <div
              key={org.id}
              className="flex items-center justify-between px-5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground dark:text-zinc-100">
                  {org.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {org.slug} · {org.memberCount} membre(s) · {org.meetingCount}{" "}
                  RDV
                </p>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {org.createdAt.toLocaleDateString("fr-FR")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
