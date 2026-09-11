import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { libelleATravailler, libellePointFort } from "@/lib/competence-focus";
import type { SellerSkillSignature } from "@/src/core/domain/seller-skill-signature";

/**
 * Le focus de progression du commercial, sur son propre tableau de bord.
 *
 * C'est exactement ce que son manager lit sur lui dans la carte « à coacher en
 * priorité » : son point fort et son axe d'amélioration, tirés de la même
 * signature de compétences et écrits par les mêmes fonctions. Le commercial
 * cesse d'être le seul à ignorer ce qu'on dit de lui, et les deux écrans ne
 * peuvent pas se contredire.
 *
 * La carte ne s'arrête pas au constat : elle mène au coaching détaillé, où le
 * radar, les affinités DISC et SONCAS et le KISS disent quoi faire, avec le
 * geste concret pour le prochain rendez-vous.
 *
 * Sans signature, la carte ne se cache pas : elle dit ce qu'il faut faire pour
 * qu'elle se remplisse. Un axe d'amélioration n'apparaît qu'une fois des
 * rendez-vous analysés, et le commercial doit savoir que c'est à sa portée.
 *
 * Elle se pose en bande sous la position, sur toute la largeur : les deux
 * répondent à la même question, « où j'en suis, et sur quoi progresser », et se
 * lisent d'affilée plutôt que côte à côte, où la position, plus dense, aurait
 * écrasé sa colonne.
 */
export function CommercialCoachingFocus({
  skillSignature,
  coachingHref,
  className,
}: {
  skillSignature: SellerSkillSignature | null;
  /** Vers « Ma performance » : le coaching détaillé de ce commercial. */
  coachingHref: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6 dark:border-zinc-800 dark:bg-zinc-900 ${className ?? ""}`}
    >
      <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase dark:text-zinc-400">
          Mon focus de progression
        </span>
        {skillSignature ? (
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {libellePointFort(skillSignature)}
            </span>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {libelleATravailler(skillSignature)}
            </span>
          </span>
        ) : (
          <span className="text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
            Analysez vos rendez-vous pour révéler votre point fort et votre axe
            d&apos;amélioration, comparés à votre équipe.
          </span>
        )}
      </div>
      <Link
        href={coachingHref}
        className="focus-visible:ring-brand/60 text-brand inline-flex shrink-0 items-center gap-1 self-start rounded-sm text-sm font-medium outline-none hover:underline focus-visible:ring-2 sm:self-auto"
      >
        Voir mon coaching détaillé
        <ArrowRight className="size-4 shrink-0" aria-hidden />
      </Link>
    </div>
  );
}
