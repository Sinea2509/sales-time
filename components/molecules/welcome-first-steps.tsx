import Link from "next/link";
import { FileAudio, Gauge, Sparkles } from "lucide-react";
import { Icon3d } from "@/components/atoms/icon-3d";
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
    tone: "violet",
    title: "Déposez un rendez-vous",
    text: "Transcript Teams, Zoom, Meet ou enregistrement audio.",
  },
  {
    icon: Gauge,
    tone: "coral",
    title: "Recevez votre analyse",
    text: "Votre note sur 100, votre prospect, ses objections.",
  },
  {
    icon: Sparkles,
    tone: "amber",
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
    <section className="relative overflow-hidden rounded-2xl border border-brand/20 bg-[linear-gradient(135deg,rgba(108,77,255,0.12),rgba(255,138,91,0.08)_55%,transparent)] bg-card p-6 sm:p-8">
      <div className="relative max-w-2xl space-y-2">
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
      <ol className="relative mt-6 grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, tone, title, text }, index) => (
          <li
            key={title}
            className="rounded-2xl border border-border/70 bg-card/85 p-4 shadow-[0_12px_24px_-16px_rgba(60,40,140,0.3)] backdrop-blur transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5"
          >
            <div className="mb-3 flex items-center gap-3">
              <Icon3d tone={tone} size="md">
                <Icon aria-hidden />
              </Icon3d>
              <span className="text-muted-foreground text-xs font-semibold tabular-nums">
                Étape {index + 1}
              </span>
            </div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-muted-foreground mt-1 text-sm">{text}</p>
          </li>
        ))}
      </ol>
      <div className="relative mt-6 flex flex-wrap items-center gap-4">
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
