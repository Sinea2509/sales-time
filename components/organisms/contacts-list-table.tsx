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
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmptyRow
              colSpan={4}
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
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
