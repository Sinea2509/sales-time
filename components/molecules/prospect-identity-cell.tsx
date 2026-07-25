import Link from "next/link";
import { prospectInitials } from "@/lib/prospect-initials";

type ProspectIdentityCellProps = {
  displayName: string;
  company?: string | null;
  href?: string;
};

export function ProspectIdentityCell({
  displayName,
  company,
  href,
}: ProspectIdentityCellProps) {
  /*
    Sur téléphone le nom et l'entreprise passent à la ligne au lieu d'être
    coupés. La hauteur ne coûte rien sur un écran qui défile déjà, la largeur
    coûte tout : c'est elle qui décide si la colonne suivante tient à l'écran.
    Et « Établissements P… » ne désigne aucune entreprise en particulier, alors
    que deux lignes la nomment. À partir de « sm », la place existe et la
    coupure propre redevient préférable, car un retour à la ligne déformerait
    la hauteur des lignes du tableau.
  */
  const nameClassName =
    "font-semibold text-zinc-950 sm:truncate dark:text-zinc-50";

  return (
    <div className="flex items-center gap-3">
      {/*
        La pastille d'initiales redit en deux lettres le nom écrit juste à
        côté. Elle coûte 48px de largeur pour cela, et tant que la colonne est
        serrée, le nom entier les vaut mieux : sur téléphone et sur tablette
        elle ferait couper « Camille Bertrand-Delaunay » en « Camille
        Bertrand… ». Elle ne revient qu'à partir de « lg », où la place est
        acquise et où l'œil parcourt une longue liste.
      */}
      <div
        className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 lg:flex dark:bg-zinc-800 dark:text-zinc-200"
        aria-hidden
      >
        {prospectInitials(displayName)}
      </div>
      <div className="min-w-0">
        {href ? (
          <Link
            href={href}
            className={`text-brand hover:underline ${nameClassName}`}
          >
            {displayName}
          </Link>
        ) : (
          <p className={nameClassName}>{displayName}</p>
        )}
        {company?.trim() ? (
          <p className="text-muted-foreground text-xs sm:truncate dark:text-zinc-400">
            {company.trim()}
          </p>
        ) : null}
      </div>
    </div>
  );
}
