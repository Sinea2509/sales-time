/** Durée d’affichage d’un slide (ms), à garder alignée avec le libellé sur la landing. */
export const LANDING_TESTIMONIAL_INTERVAL_MS = 6000;

export type LandingTestimonialKpi = {
  label: string;
  value: string;
};

export type LandingTestimonialSlide = {
  quote: string;
  role: string;
  context: string;
  initials: string;
  /** Dégradé discret pour le portrait placeholder (gauche). */
  portrait: string;
  kpis: [LandingTestimonialKpi, LandingTestimonialKpi, LandingTestimonialKpi];
};

export const landingTestimonialSlides: LandingTestimonialSlide[] = [
  {
    quote:
      "On a enfin un fil conducteur après les RDV : la synthèse et le mail de relance nous font gagner un créneau entier chaque semaine.",
    role: "Directrice commerciale",
    context: "PME logiciel · 14 commerciaux",
    initials: "ML",
    portrait:
      "from-zinc-400 via-zinc-500 to-zinc-700 dark:from-zinc-600 dark:via-zinc-700 dark:to-zinc-900",
    kpis: [
      { label: "Temps libéré", value: "~4 h" },
      { label: "RDV coachés / mois", value: "120+" },
      { label: "Adoption équipe", value: "92 %" },
    ],
  },
  {
    quote:
      "Je m’en sers en debrief d’équipe : les thèmes KISS qui reviennent m’aident à prioriser la formation sans lire toutes les notes.",
    role: "Manager sales",
    context: "Scale-up B2B services",
    initials: "TB",
    portrait:
      "from-slate-400 via-slate-500 to-slate-700 dark:from-slate-600 dark:via-slate-700 dark:to-slate-900",
    kpis: [
      { label: "Debriefs structurés", value: "2 / sem." },
      { label: "Thèmes KISS suivis", value: "8" },
      { label: "Charge lecture notes", value: "-60 %" },
    ],
  },
  {
    quote:
      "Le pitch sur le ROI est plus simple : TAM cumulé et volume de RDV coachés, c’est lisible en comité de direction.",
    role: "VP Revenue",
    context: "Groupe multi-sites",
    initials: "JD",
    portrait:
      "from-neutral-400 via-neutral-500 to-neutral-700 dark:from-neutral-600 dark:via-neutral-700 dark:to-neutral-900",
    kpis: [
      { label: "TAM suivi", value: "1,2 M€" },
      { label: "RDV analysés / trim.", value: "840" },
      { label: "Présentations CODIR", value: "6" },
    ],
  },
];
