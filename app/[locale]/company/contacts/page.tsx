import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getApplicationDeps } from "@/lib/application-deps";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { buttonVariants } from "@/components/ui/button";
import { pageTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const rows = await deps.contacts.listForOrg({
    organizationId: actor.activeOrganizationId,
    search: undefined,
    limit: 200,
    offset: 0,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={pageTitleClass}>Contacts</h1>
        <Link
          href="/company/contacts/nouveau"
          className={cn(
            buttonVariants(),
            "bg-brand text-primary-foreground hover:bg-brand-hover inline-flex h-9 w-fit shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium",
          )}
        >
          <Plus className="size-4 shrink-0" aria-hidden />
          Nouveau contact
        </Link>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Société</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="hidden md:table-cell">Téléphone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  Aucun contact pour le moment. Créez-en un ou importez-les via
                  un rendez-vous.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/company/contacts/${r.id}`}
                      className="text-brand hover:underline"
                    >
                      {r.displayName}
                    </Link>
                  </TableCell>
                  <TableCell>{r.company ?? "—"}</TableCell>
                  <TableCell>{r.email ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {r.phone ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
