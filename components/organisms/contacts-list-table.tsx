import Link from "next/link";
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
            <TableEmptyRow
              colSpan={4}
              message="Aucun contact pour le moment. Créez-en un ou importez-les via un rendez-vous."
            />
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
  );
}
