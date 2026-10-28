import { Check, Gauge, Sparkles, UsersRound } from "lucide-react";
import { Icon3d, type Icon3dTone } from "@/components/atoms/icon-3d";
import { Visual3d } from "@/components/atoms/visual-3d";
import { BrandCtaLink } from "@/components/molecules/brand-cta-link";
import { cn } from "@/lib/utils";

type Milestone = {
  /** Rendez-vous analysés qu'il faut pour l'atteindre. */
  at: number;
  title: string;
  text: string;
  icon: typeof Gauge;
  tone: Icon3dTone;
};

type Props = {
  /** Rendez-vous analysés sur la période. */
  analyzed: number;
  /** Rendez-vous déposés sur la période, analysés ou non. */
  deposited: number;
  /** Seuil des profils DISC et SONCAS (`MIN_RDV_FOR_STATS`). */
  profileThreshold: number;
  /** « vous » chez le commercial, « ce commercial » chez son manager. */
  perspective: "commercial" | "manager";
  /** Où déposer un rendez-vous ; absent chez le manager. */
  newMeetingHref?: string;
  /** La période, en clair : « 30 derniers jours ». */
  periodLabel: string;
};

/**
 * Ce que la page « Ma performance » montrera, et à partir de quand.
 *
 * Revue UX du 21 octobre 2026 : un commercial qui démarre voyait « 0 »,
 * « n. c. » et trois fois « Pas assez de données ». Un seul panneau dit
 * désormais ce qui se débloque, à quel rendez-vous, et où il en est.
 */
export function PerformanceUnlockPanel({
  analyzed,
  deposited,
  profileThreshold,
  perspective,
  newMeetingHref,
  periodLabel,
}: Props) {
  const vous = perspective === "commercial";
  const milestones: Milestone[] = [
    {
      at: 1,
      title: vous ? "Votre SalesScore et votre coaching" : "Son SalesScore",
      text: vous
        ? "Dès le premier rendez-vous analysé : une note sur 100 et les phrases à dire la prochaine fois."
        : "Dès le premier rendez-vous analysé : une note sur 100 et un coaching par rendez-vous.",
      icon: Gauge,
      tone: "violet",
    },
    {
      at: profileThreshold,
      title: vous
        ? "Vos affinités DISC et SONCAS"
        : "Ses affinités DISC et SONCAS",
      text: `À partir de ${profileThreshold} rendez-vous analysés : les profils de prospects avec lesquels ${vous ? "vous réussissez" : "ce commercial réussit"} le mieux, et comment s'adapter aux autres.`,
      icon: UsersRound,
      tone: "coral",
    },
    {
      at: profileThreshold,
      title: vous ? "Votre profil de performance" : "Son profil de performance",
      text: `Forces, axes de progrès et tendances d'une période à l'autre.`,
      icon: Sparkles,
      tone: "amber",
    },
  ];
  const pct = Math.min(analyzed / profileThreshold, 1) * 100;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-brand/20 bg-[linear-gradient(135deg,rgba(79,85,240,0.08),transparent_60%)] bg-card p-6 sm:p-8">
      <Visual3d
        name={
          analyzed === 0 && deposited > 0
            ? "c2-analyse-en-cours"
            : "c3-donnees-insuffisantes"
        }
        width={160}
        height={120}
        className="pointer-events-none absolute top-3 right-8 hidden lg:inline-block"
      />
      <div className="max-w-2xl space-y-2">
        <p className="text-brand text-xs font-semibold tracking-[0.14em] uppercase">
          {vous ? "Votre profil se construit" : "Son profil se construit"}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          {analyzed > 0
            ? `${analyzed} rendez-vous analysé${analyzed > 1 ? "s" : ""} sur les ${periodLabel}`
            : deposited > 0
              ? deposited === 1
                ? "Un rendez-vous déposé, son analyse arrive"
                : `${deposited} rendez-vous déposés, leur analyse arrive`
              : vous
                ? "Tout commence avec votre premier rendez-vous analysé"
                : "Aucun rendez-vous analysé pour l'instant"}
        </h2>
        {analyzed === 0 && deposited > 0 ? (
          <p className="text-muted-foreground text-sm">
            {vous
              ? "L'analyse prend quelques minutes ; vous recevez un mail dès qu'elle est prête."
              : "L'analyse prend quelques minutes après le dépôt."}
          </p>
        ) : null}
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={profileThreshold}
          aria-valuenow={Math.min(analyzed, profileThreshold)}
          aria-label={`${Math.min(analyzed, profileThreshold)} rendez-vous analysés sur ${profileThreshold}`}
          className="mt-4 h-2.5 max-w-md overflow-hidden rounded-full bg-muted"
        >
          <div
            className="st-bar from-brand to-brand-deep h-full rounded-full bg-gradient-to-r"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {milestones.map(({ at, title, text, icon: Icon, tone }) => {
          const reached = analyzed >= at;
          return (
            <li
              key={title}
              className={cn(
                "rounded-2xl border bg-card/85 p-4 shadow-[0_12px_24px_-16px_rgba(60,40,140,0.3)]",
                reached ? "border-brand/40" : "border-border/70",
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <Icon3d tone={tone} size="md">
                  <Icon aria-hidden />
                </Icon3d>
                {reached ? (
                  <span className="text-brand inline-flex items-center gap-1 text-xs font-semibold">
                    <Check className="size-3.5" aria-hidden />
                    Débloqué
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs font-medium tabular-nums">
                    {Math.min(analyzed, at)}/{at}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {text}
              </p>
            </li>
          );
        })}
      </ol>

      {newMeetingHref ? (
        <div className="mt-6">
          <BrandCtaLink href={newMeetingHref} size="md">
            {analyzed === 0 && deposited === 0
              ? "Déposer mon premier rendez-vous"
              : "Déposer un rendez-vous"}
          </BrandCtaLink>
        </div>
      ) : null}
    </section>
  );
}
