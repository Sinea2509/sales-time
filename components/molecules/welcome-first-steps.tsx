import Link from "next/link";
import { FileAudio, Gauge, Sparkles } from "lucide-react";
import { BrandCtaLink } from "@/components/molecules/brand-cta-link";

type Props = {
  /** Où déposer un rendez-vous. */
  newMeetingHref: string;
  /** Le guide de démarrage, pour le revoir. */
  guideHref: string;
};

const STEPS = [
  {
    icon: FileAudio,
    title: "Déposez un rendez-vous",
    text: "Transcript Teams, Zoom, Meet ou enregistrement audio.",
  },
  {
    icon: Gauge,
    title: "Recevez votre analyse",
    text: "Votre note sur 100, votre prospect, ses objections.",
  },
  {
    icon: Sparkles,
    title: "Progressez",
    text: "La phrase à dire la prochaine fois, critère par critère.",
  },
] as const;

/**
 * L'accueil d'un commercial qui n'a encore déposé aucun rendez-vous.
 *
 * Avant le 20 octobre 2026, un invité arrivait sur un tableau de bord vide,
 * sans rien qui dise par où commencer. Cette carte disparaît d'elle-même dès
 * le premier rendez-vous déposé.
 */
export function WelcomeFirstSteps({ newMeetingHref, guideHref }: Props) {
  return (
    <section className="from-brand/10 via-brand-soft to-card relative overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-br p-6 sm:p-8">
      <div className="max-w-2xl space-y-2">
        <p className="text-brand text-xs font-semibold tracking-[0.14em] uppercase">
          Premiers pas
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Votre premier coaching est à un rendez-vous près
        </h2>
        <p className="text-muted-foreground text-sm">
          Déposez un rendez-vous : l&apos;analyse arrive en quelques minutes, et
          vous recevez un mail dès qu&apos;elle est prête.
        </p>
      </div>
      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }, index) => (
          <li
            key={title}
            className="rounded-xl border border-border/70 bg-card/80 p-4 shadow-xs backdrop-blur"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="bg-brand text-brand-foreground flex size-7 items-center justify-center rounded-lg text-xs font-semibold">
                {index + 1}
              </span>
              <Icon className="text-brand size-4" aria-hidden />
            </div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-muted-foreground mt-1 text-sm">{text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <BrandCtaLink href={newMeetingHref} size="md">
          Déposer mon premier rendez-vous
        </BrandCtaLink>
        <Link
          href={guideHref}
          className="text-brand text-sm font-medium hover:underline"
        >
          Revoir le guide de démarrage
        </Link>
      </div>
    </section>
  );
}
