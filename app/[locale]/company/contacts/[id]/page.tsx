import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { ContactEditForm } from "@/components/organisms/contact-edit-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { pageTitleClass, sectionHeadingClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const outcomesFr: Record<string, string> = {
  WON: "Gagné",
  LOST: "Perdu",
  FOLLOW_UP: "Suivi",
  NO_SHOW: "Absent",
  OTHER: "Autre",
};

type Props = { params: Promise<{ id: string }> };

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const contact = await deps.contacts.findById({
    id,
    organizationId: actor.activeOrganizationId,
  });
  if (!contact) notFound();

  const meetings = await deps.meetings.listMeetingsForPersonInOrg({
    organizationId: actor.activeOrganizationId,
    personId: id,
  });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/company/contacts"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-2 -ml-2",
          )}
        >
          ← Contacts
        </Link>
        <h1 className={pageTitleClass}>{contact.displayName}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Fiche contact et historique des rendez-vous.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className={sectionHeadingClass}>Informations</h2>
        <ContactEditForm contact={contact} />
      </section>

      <section className="space-y-3">
        <h2 className={sectionHeadingClass}>Rendez-vous</h2>
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Résultat</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-muted-foreground py-8 text-center text-sm"
                  >
                    Aucun rendez-vous lié à ce contact.
                  </TableCell>
                </TableRow>
              ) : (
                meetings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {m.meetingAt.toLocaleDateString("fr-FR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell>{outcomesFr[m.outcome] ?? m.outcome}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/company/rendez-vous/${m.id}`}
                        className="text-brand text-sm font-medium hover:underline"
                      >
                        Ouvrir
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
