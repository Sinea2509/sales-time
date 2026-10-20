import { BrandCtaLink } from "@/components/molecules/brand-cta-link";
import { ContentCard } from "@/components/molecules/content-card";

type Props = {
  /** Où déposer un rendez-vous. */
  newMeetingHref: string;
};

const STEPS = [
  {
    title: "Déposez votre premier rendez-vous",
    text: "Le transcript de Teams, Zoom ou Meet, ou l'enregistrement audio. Lancez l'enregistrement dès le bonjour : votre ouverture compte dans la note.",
  },
  {
    title: "Recevez votre analyse en quelques minutes",
    text: "Votre note sur 100 critère par critère, ce qui fait choisir votre prospect et comment il communique, ses objections, et votre coaching.",
  },
  {
    title: "Progressez d'un rendez-vous à l'autre",
    text: "Chaque fiche vous dit où gagner des points, avec la phrase à dire la prochaine fois. Votre tableau de bord suit votre progression.",
  },
] as const;

/**
 * L'accueil d'un commercial qui n'a encore déposé aucun rendez-vous.
 *
 * Avant le 20 octobre 2026, un invité arrivait sur un tableau de bord vide,
 * sans rien qui dise par où commencer. Cette carte disparaît d'elle-même dès
 * le premier rendez-vous déposé.
 */
export function WelcomeFirstSteps({ newMeetingHref }: Props) {
  return (
    <ContentCard
      title="Bienvenue sur Sales Time"
      description="Trois étapes pour recevoir votre premier coaching."
    >
      <ol className="space-y-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span
              aria-hidden
              className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            >
              {index + 1}
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-muted-foreground text-sm">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6">
        <BrandCtaLink href={newMeetingHref}>
          Déposer mon premier rendez-vous
        </BrandCtaLink>
      </div>
    </ContentCard>
  );
}
