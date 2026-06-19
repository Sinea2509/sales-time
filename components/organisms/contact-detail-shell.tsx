import Link from "next/link";
import { ContactEditForm } from "@/components/organisms/contact-edit-form";
import { PageDetailHeader } from "@/components/molecules/page-header";
import { TableEmptyRow } from "@/components/atoms/table-empty-row";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { sectionHeadingClass } from "@/lib/page-typography";
import type { ContactSummaryRow } from "@/src/core/ports/contact-repository-port";

const outcomesFr: Record<string, string> = {
  WON: "Gagné",
  LOST: "Perdu",
  FOLLOW_UP: "Suivi",
  NO_SHOW: "Absent",
  OTHER: "Autre",
};

type ContactMeetingRow = {
  id: string;
  meetingAt: Date;
  outcome: string;
};

type ContactDetailShellProps = {
  contact: ContactSummaryRow;
  meetings: ContactMeetingRow[];
};

export function ContactDetailShell({
  contact,
  meetings,
}: ContactDetailShellProps) {
  return (
    <div className="space-y-8">
      <PageDetailHeader
        backHref="/company/contacts"
        title={contact.displayName}
        meta={<span>Fiche contact et historique des rendez-vous.</span>}
      />

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
                <TableEmptyRow
                  colSpan={3}
                  message="Aucun rendez-vous lié à ce contact."
                />
              ) : (
                meetings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {m.meetingAt.toLocaleString("fr-FR", {
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
