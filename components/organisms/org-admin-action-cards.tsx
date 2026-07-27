import { ChevronRight, Mic, Target, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type {
  MembreMisEnAvant,
  EssentielDuManager,
} from "@/lib/essentiel-du-manager";

/**
 * Les trois cartes que le manager lit avant tout le reste : qui tire l'équipe,
 * qui coacher en premier, qui n'est pas encore évaluable.
 *
 * Aucun calcul ici : tout vient de `essentielDuManager`, testé à part, et la
 * carte se contente de poser les phrases reçues. Les deux cartes de personnes
 * sont des liens entiers vers la fiche : c'est la fiche qui porte la réponse à
 * la question que la carte pose, et un manager sur téléphone tape une carte,
 * pas un mot souligné dedans.
 *
 * Chaque carte porte sa couleur d'état en plus de son intitulé et de son
 * icône, jamais à leur place : vert pour ce qui va, ambre pour ce qui demande
 * une action, bleu pour ce qui attend des données. Le violet de la marque n'y
 * figure pas : il est réservé aux actions et à la navigation, et ces cartes
 * sont une lecture.
 */

const ETIQUETTE =
  "inline-flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase";

function EtiquetteDeCarte({
  icon: Icon,
  teinteTexte,
  teintePastille,
  children,
}: {
  icon: LucideIcon;
  teinteTexte: string;
  teintePastille: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`${ETIQUETTE} ${teinteTexte}`}>
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-lg ${teintePastille}`}
        aria-hidden
      >
        <Icon className="size-4" />
      </span>
      {children}
    </span>
  );
}

/** Nom, rang et note d'un membre, la partie commune aux deux cartes de personnes. */
function CorpsDeMembre({
  membre,
  precisionDeRang,
}: {
  membre: MembreMisEnAvant;
  precisionDeRang: string | null;
}) {
  return (
    <>
      <span className="mt-3 flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {membre.initiales}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {membre.nom}
            </span>
            <span className="block text-xs text-zinc-600 dark:text-zinc-400">
              {membre.rangEtBase}
              {precisionDeRang ? ` · ${precisionDeRang}` : null}
            </span>
          </span>
        </span>
        <span className="flex shrink-0 items-baseline gap-0.5">
          <span className="text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-100">
            {membre.note}
          </span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            /5
          </span>
        </span>
      </span>
      {membre.competence ? (
        <span className="mt-2.5 block border-t border-zinc-100 pt-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          {membre.competence}
        </span>
      ) : null}
    </>
  );
}

const CARTE =
  "rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900";

function CarteDeMembre({
  membre,
  etiquette,
  precisionDeRang,
}: {
  membre: MembreMisEnAvant;
  etiquette: React.ReactNode;
  precisionDeRang: string | null;
}) {
  return (
    <Link
      href={membre.href}
      className={`${CARTE} group block transition-shadow hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700`}
    >
      <span className="flex items-center justify-between gap-2">
        {etiquette}
        {/*
          La flèche dit que la carte s'ouvre : sans elle, rien ne distingue ces
          deux cartes-liens de leur voisine qui n'en est pas un.
        */}
        <ChevronRight
          className="size-4 text-zinc-400 transition-transform group-hover:translate-x-0.5 dark:text-zinc-500"
          aria-hidden
        />
      </span>
      <CorpsDeMembre membre={membre} precisionDeRang={precisionDeRang} />
    </Link>
  );
}

export function OrgAdminActionCards({
  essentiel,
}: {
  essentiel: EssentielDuManager;
}) {
  const { meneur, premierRangPartage, aCoacher, aFaireAnalyser } = essentiel;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {meneur ? (
        <CarteDeMembre
          membre={meneur}
          precisionDeRang={premierRangPartage}
          etiquette={
            <EtiquetteDeCarte
              icon={Trophy}
              teinteTexte="text-emerald-700 dark:text-emerald-400"
              teintePastille="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            >
              En tête
            </EtiquetteDeCarte>
          }
        />
      ) : null}
      {aCoacher ? (
        <CarteDeMembre
          membre={aCoacher}
          precisionDeRang={null}
          etiquette={
            <EtiquetteDeCarte
              icon={Target}
              teinteTexte="text-amber-700 dark:text-amber-400"
              teintePastille="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            >
              À coacher en priorité
            </EtiquetteDeCarte>
          }
        />
      ) : null}
      {aFaireAnalyser.length > 0 ? (
        <div className={CARTE}>
          <EtiquetteDeCarte
            icon={Mic}
            teinteTexte="text-sky-700 dark:text-sky-400"
            teintePastille="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
          >
            À faire analyser
          </EtiquetteDeCarte>
          <ul className="mt-3 space-y-1.5">
            {aFaireAnalyser.map((ligne) => (
              <li
                key={ligne}
                className="text-sm text-zinc-700 dark:text-zinc-300"
              >
                {ligne}
              </li>
            ))}
          </ul>
          <p className="mt-2.5 border-t border-zinc-100 pt-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Les analyses de rendez-vous nourrissent la note, le classement et le
            coaching.
          </p>
        </div>
      ) : null}
    </div>
  );
}
