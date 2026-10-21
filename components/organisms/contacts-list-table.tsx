import { ProspectIdentityCell } from "@/components/molecules/prospect-identity-cell";
import { ContactRowActions } from "@/components/organisms/contact-row-actions";
import { BrandCtaLink } from "@/components/molecules/brand-cta-link";
import { PrdEmptyState } from "@/components/molecules/prd-empty-state";
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

/**
 * Un champ facultatif que personne n'a rempli.
 *
 * Le texte le dit, plutôt qu'un tiret qui laisse hésiter entre « vide »,
 * « inconnu » et « bogue d'affichage », et le gris le fait passer derrière
 * les vraies valeurs de la colonne.
 */
function formatContactField(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (trimmed) return trimmed;
  return <span className="text-muted-foreground">Non renseigné</span>;
}

export function ContactsListTable({ rows }: ContactsListTableProps) {
  /*
    Revue UX du 21 octobre 2026 : un tableau vide à cinq colonnes ne dit pas
    que les contacts se créent d'eux-mêmes au dépôt d'un rendez-vous.
  */
  if (rows.length === 0) {
    return (
      <PrdEmptyState
        illustration="c4-aucun-contact"
        title="Aucun contact pour l'instant"
        description="Vos contacts se créent d'eux-mêmes quand vous déposez un rendez-vous : Sales Time lit le nom du prospect dans la conversation. Vous pouvez aussi en créer un à la main."
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <BrandCtaLink href="/company/rendez-vous/nouveau" size="md">
              Déposer un rendez-vous
            </BrandCtaLink>
            <BrandCtaLink
              href="/company/contacts?create=1"
              size="md"
              variant="outline"
            >
              Créer un contact
            </BrandCtaLink>
          </div>
        }
      />
    );
  }

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
          {rows.map((r) => (
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
