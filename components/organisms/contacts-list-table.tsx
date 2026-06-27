import { ProspectIdentityCell } from "@/components/molecules/prospect-identity-cell";
import { ContactRowActions } from "@/components/organisms/contact-row-actions";
import { TableEmptyRow } from "@/components/atoms/table-empty-row";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ContactSummaryRow } from "@/src/core/ports/contact-repository-port";

type ContactsListTableProps = {
  rows: ContactSummaryRow[];
};

function formatContactField(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

export function ContactsListTable({ rows }: ContactsListTableProps) {
  return (
    <div className="rounded-xl border" data-feedback-id="contacts-list-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Entreprise</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead className="w-14 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmptyRow
              colSpan={5}
              message="Aucun contact pour le moment. Créez-en un ou importez-les via un rendez-vous."
            />
          ) : (
            rows.map((r) => (
              <TableRow key={r.id} data-feedback-id="contacts-row">
                <TableCell className="max-w-[12rem] truncate">
                  {formatContactField(r.company)}
                </TableCell>
                <TableCell className="font-medium">
                  <ProspectIdentityCell
                    displayName={r.displayName}
                    href={`/company/contacts/${r.id}`}
                  />
                </TableCell>
                <TableCell className="max-w-[14rem] truncate">
                  {formatContactField(r.email)}
                </TableCell>
                <TableCell className="max-w-[10rem] truncate">
                  {formatContactField(r.phone)}
                </TableCell>
                <TableCell className="text-right align-middle">
                  <ContactRowActions contact={r} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
