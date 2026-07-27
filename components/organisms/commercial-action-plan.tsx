import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { sectionHeadingClass } from "@/lib/page-typography";
import type {
  CoachingAction,
  CoachingActionKind,
} from "@/src/core/domain/seller-action-plan";

/**
 * Le plan d'action de la semaine du commercial, entre ses chiffres et ses
 * rendez-vous : d'abord où il en est, puis quoi faire, puis avec qui.
 *
 * Les gestes viennent de son coaching KISS, déjà écrits comme un coach parle :
 * le rituel à lancer, le geste à affiner, avec le mouvement concret pour le
 * prochain rendez-vous. La carte les numérote pour dire qu'ils se prennent dans
 * l'ordre, et mène au coaching complet pour le reste.
 *
 * Sans geste, la carte ne disparaît pas : elle dit comment le remplir. Un plan
 * d'action ne se déduit que de rendez-vous analysés, et le commercial doit
 * savoir que c'est ce qui le débloque.
 */

const ETIQUETTE_PAR_TYPE: Record<
  CoachingActionKind,
  { readonly libelle: string; readonly classe: string }
> = {
  start: {
    libelle: "Nouveau rituel",
    classe:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  improve: {
    libelle: "À affiner",
    classe: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
};

export function CommercialActionPlan({
  actions,
  coachingHref,
}: {
  actions: CoachingAction[];
  /** Vers « Ma performance » : le coaching complet, les quatre colonnes KISS. */
  coachingHref: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className={sectionHeadingClass}>
          Mon plan d&apos;action de la semaine
        </h2>
        <Link
          href={coachingHref}
          className="focus-visible:ring-brand/60 text-brand inline-flex shrink-0 items-center gap-1 rounded-sm text-sm font-medium outline-none hover:underline focus-visible:ring-2"
        >
          Voir tout mon coaching
          <ArrowRight className="size-4 shrink-0" aria-hidden />
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        {actions.length > 0 ? (
          <ol className="space-y-3.5">
            {actions.map((action, index) => {
              const etiquette = ETIQUETTE_PAR_TYPE[action.kind];
              return (
                <li key={`${action.kind}-${index}`} className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${etiquette.classe}`}
                    >
                      {etiquette.libelle}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {action.text}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Analysez vos rendez-vous pour recevoir votre plan d&apos;action :
            les gestes concrets à travailler cette semaine apparaîtront ici,
            tirés de votre coaching.
          </p>
        )}
      </div>
    </section>
  );
}
