import { ProspectIdentityCell } from "@/components/molecules/prospect-identity-cell";
import { TableEmptyRow } from "@/components/atoms/table-empty-row";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type ContactListRow = {
  id: string;
  displayName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
};

type ContactsListTableProps = {
  rows: ContactListRow[];
};

export function ContactsListTable({ rows }: ContactsListTableProps) {
  return (
    <div className="rounded-xl border" data-feedback-id="contacts-list-table">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead className="hidden sm:table-cell">E-mail</TableHead>
            <TableHead className="hidden md:table-cell">Téléphone</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmptyRow
              colSpan={3}
              message="Aucun contact pour le moment. Créez-en un ou importez-les via un rendez-vous."
            />
          ) : (
            rows.map((r) => (
              <TableRow key={r.id} data-feedback-id="contacts-row">
                <TableCell className="font-medium">
                  <ProspectIdentityCell
                    displayName={r.displayName}
                    company={r.company}
                    href={`/company/contacts/${r.id}`}
                  />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {r.email ?? "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {r.phone ?? "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
