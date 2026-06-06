import Link from "next/link";
import { redirect } from "next/navigation";
import { ContactCreateDialog } from "@/components/organisms/contact-create-dialog";
import { getApplicationDeps } from "@/lib/application-deps";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { pageTitleClass } from "@/lib/page-typography";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

type ContactsPageProps = {
  searchParams: Promise<{ create?: string }>;
};

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const { create } = await searchParams;

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
        <ContactCreateDialog
          key={create === "1" ? "create-open" : "create-closed"}
          defaultOpen={create === "1"}
        />
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
