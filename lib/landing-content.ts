import type { LucideIcon } from "lucide-react";
import {
  FileText,
  LayoutDashboard,
  Mail,
  Sparkles,
  User,
  Users,
} from "lucide-react";

export const landingHeroStats = [
  { value: "42 min", label: "Temps moyen économisé après chaque RDV" },
  { value: "5+", label: "Frameworks (KISS, DISC…)" },
  { value: "100%", label: "Données restent les vôtres" },
  { value: "24/7", label: "Disponible après chaque RDV" },
] as const;

export const landingCtaTrustItems = [
  "Hébergement UE",
  "Rôles & accès inclus",
  "Pas de carte bancaire",
] as const;

export type LandingCustomerBrand = {
  initials: string;
  name: string;
  color: string;
};

export const landingCustomerBrands: LandingCustomerBrand[] = [
  { initials: "NV", name: "Novalis ERP", color: "#4F46E5" },
  { initials: "KM", name: "Kermor Media", color: "#0891B2" },
  { initials: "BX", name: "Bexon Logistique", color: "#D97706" },
  { initials: "AR", name: "Archetype Labs", color: "#7C3AED" },
  { initials: "ML", name: "Maillon Santé", color: "#0D9488" },
  { initials: "CT", name: "Côté Terre", color: "#65A30D" },
];

export type LandingPerspectiveTab = {
  id: string;
  label: string;
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
};

export const landingPerspectiveTabs: LandingPerspectiveTab[] = [
  {
    id: "commercial",
    label: "Commercial",
    icon: User,
    title:
      "Réduisez drastiquement votre temps administratif, optimisez votre Temps Utile Commercial (TUC)",
    description: "Un outil créé par des Sales, pour des Sales.",
    bullets: [
      "Compte rendu de RDV structuré",
      "Coaching KISS",
      "Mail de suivi prêt à envoyer",
      "Profil DISC et SONCAS de votre interlocuteur",
      "Préparation automatique du prochain RDV",
      "Sans repasser des heures sur le CRM",
    ],
  },
  {
    id: "manager",
    label: "Manager",
    icon: Users,
    title: "Mesurez le ROI commercial avec clarté",
    description:
      "Indicateurs consolidés : TUC, TAM, volume et thématiques récurrentes. Un argument ROI clair pour piloter l'investissement commercial.",
    bullets: [
      "KPIs consolidés : TUC, TAM, volume global",
      "Thématiques KISS récurrentes sur l'ensemble",
      "Progression mois après mois",
      "Argument ROI structuré pour arbitrages budgétaires",
    ],
  },
];

export const landingHowSteps = [
  {
    step: "01",
    title: "Collez votre transcript",
    description:
      "Après le RDV, importez ou collez le texte issu de votre visio ou enregistrement. Tout format texte fonctionne.",
    icon: FileText,
  },
  {
    step: "02",
    title: "Notre IA génère la fiche RDV",
    description:
      "Synthèse, coaching KISS, profil DISC/SONCAS avec verbatims et mail de suivi, en quelques secondes.",
    icon: Sparkles,
  },
  {
    step: "03",
    title: "Suivez vos progrès",
    description:
      "Retrouvez sur votre tableau de bord le cumul TAM, vos tendances et les prochaines actions à prioriser.",
    icon: LayoutDashboard,
  },
] as const;

export const landingFeatureCards = [
  {
    title: "Reporting de RDV structuré",
    description:
      "Métadonnées, synthèse du contexte et des enjeux, pistes de solution, prête à partager ou à archiver dans votre CRM.",
    icon: FileText,
  },
  {
    title: "Débriefing, recommandations et coaching personnalisé après le RDV",
    description:
      "Recommandations adaptées au profil du prospect : ce qu'il faut garder, améliorer, arrêter et commencer, golden question incluse.",
    icon: Sparkles,
  },
  {
    title: "Mail de suivi client",
    description:
      "Génération d'un mail structuré (remerciement, rappel des enjeux, prochaines étapes) modifiable avant envoi.",
    icon: Mail,
  },
  {
    title: "Dashboard manager",
    description:
      "Vue équipe : volumes, TAM agrégé, répartition des types de RDV et thématiques KISS, sans exposer les notes individuelles.",
    icon: LayoutDashboard,
  },
] as const;

export const landingTestimonial = {
  quote:
    "On a enfin un fil conducteur après les RDV : la synthèse et le mail de relance nous font gagner une demi-journée entière chaque semaine.",
  name: "Directrice commerciale",
  role: "PME logiciel · 14 commerciaux",
  initials: "ML",
  stats: [
    { value: "~4h", label: "Temps libéré / semaine / commercial" },
    { value: "120+", label: "RDV coachés / mois" },
    { value: "100%", label: "Adoption équipe" },
  ],
} as const;

export const landingFaqItems = [
  {
    q: "Mes transcripts et analyses sont-ils confidentiels ?",
    a: "Oui. Les contenus sont traités pour votre organisation et vos rôles. Nous recommandons d'anonymiser les données personnelles sensibles si votre politique interne l'exige.",
  },
  {
    q: "Faut-il une intégration CRM pour commencer ?",
    a: "Non. Vous collez le transcript issu de votre visio / enregistrement. Les intégrations CRM enrichiront le flux dans une phase ultérieure.",
  },
  {
    q: "L'IA remplace-t-elle le manager commercial ?",
    a: "Non. L'outil accélère la structuration et le feedback, mais la décision, la relation client et le coaching humain restent au centre.",
  },
  {
    q: "Quels formats de transcript sont acceptés ?",
    a: "Tout texte brut : export visio, transcription automatique, prise de notes. L'important est un minimum de contexte (parties, sujets abordés).",
  },
  {
    q: "Puis-je inviter toute l'équipe ?",
    a: "Oui. Créez votre organisation, définissez les rôles manager / commercial et invitez vos collègues par e-mail depuis l'espace équipe.",
  },
] as const;

export const landingNavLinks = [
  { href: "#persp", label: "Fonctionnalités" },
  { href: "#how", label: "Comment ça marche" },
  { href: "#faq", label: "FAQ" },
] as const;
