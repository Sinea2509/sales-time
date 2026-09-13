import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  meetingNextAction,
  type MeetingActionInput,
  type MeetingActionTone,
} from "@/src/core/domain/meeting-next-action";

/**
 * L'état d'un rendez-vous, en une pastille cliquable qui mène à son détail.
 *
 * La pastille dit ce qu'il reste à faire, pas ce qui s'est passé : « À
 * analyser », « À relancer », « Gagné ». Quand il y a un geste à faire, une
 * flèche le dit et la teinte l'appelle ; sinon la pastille reste neutre, un
 * simple constat. Elle mène toujours au détail du rendez-vous, là où le geste
 * se fait.
 *
 * Les teintes ne sont pas décoratives : ambre pour ce qui attend une action,
 * émeraude pour gagné, rouge pour perdu, ciel pour une analyse en cours, gris
 * pour ce qui est clos et sans suite. Le violet n'y figure pas, il reste aux
 * actions de navigation.
 */

const TON_CLASSE: Record<MeetingActionTone, string> = {
  todo: "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  waiting:
    "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  won: "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  lost: "border-red-300 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
  neutral:
    "border-border bg-muted text-foreground hover:bg-muted dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",
};

export function MeetingActionBadge({
  meeting,
  href,
  className,
}: {
  meeting: MeetingActionInput;
  /** Le détail du rendez-vous, là où le geste se fait. */
  href: string;
  className?: string;
}) {
  const action = meetingNextAction(meeting);
  const aFaire = action.category != null;

  return (
    <Link
      href={href}
      className={`focus-visible:ring-brand/50 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 ${TON_CLASSE[action.tone]} ${className ?? ""}`}
      title={
        aFaire
          ? `${action.label} : ouvrir le rendez-vous pour agir.`
          : `${action.label} : ouvrir le rendez-vous.`
      }
    >
      {action.label}
      {aFaire ? <ArrowRight className="size-3 shrink-0" aria-hidden /> : null}
    </Link>
  );
}
