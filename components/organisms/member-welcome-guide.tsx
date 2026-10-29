import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Clock,
  FileAudio,
  FileText,
  Gauge,
  Mail,
  Mic,
  ShieldAlert,
  Sparkles,
  Target,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import {
  ICON_3D_TONE_CYCLE,
  Icon3d,
  type Icon3dTone,
} from "@/components/atoms/icon-3d";
import { SalesTimeLogoMark } from "@/components/atoms/sales-time-logo-mark";
import { BrandCtaLink } from "@/components/molecules/brand-cta-link";
import {
  OnboardingBrandPanel,
  OnboardingBrandPoint,
} from "@/components/molecules/onboarding-brand-panel";
import {
  OnboardingMobileHero,
  OnboardingScene3d,
  type OnboardingSceneFocus,
} from "@/components/molecules/onboarding-scene-3d";
import { StepRail } from "@/components/molecules/step-rail";
import { pageTitleClass } from "@/lib/page-typography";

export const MEMBER_GUIDE_STEPS = [
  { id: 1, label: "Bienvenue" },
  { id: 2, label: "Enregistrer" },
  { id: 3, label: "Le score" },
  { id: 4, label: "L'analyse" },
  { id: 5, label: "À vous" },
] as const;

export type MemberGuideBlock = { key: string; name: string; weight: number };

type Props = {
  step: number;
  firstName: string | null;
  organizationName: string;
  /** Les blocs de la grille de découverte, lus dans la grille elle-même. */
  gridBlocks: readonly MemberGuideBlock[];
  newMeetingHref: string;
  dashboardHref: string;
  /**
   * Le lecteur gère l'organisation, souvent parce qu'il vient de la créer :
   * aucun manager ne le suit, c'est lui qui invite son équipe.
   */
  forManager?: boolean;
};

type PanelPoint = { icon: ReactNode; title: string; text: string };

const ICON = "size-4.5";

/** L'illustration en relief de chaque étape. */
const FOCUS: Record<number, OnboardingSceneFocus> = {
  1: "welcome",
  2: "record",
  3: "score",
  4: "analysis",
  5: "start",
};

/** Le panneau de gauche de chaque étape : un titre et trois repères. */
const PANEL: Record<number, { title: string; points: PanelPoint[] }> = {
  1: {
    title: "Votre assistant commercial, après chaque rendez-vous",
    points: [
      {
        icon: <FileAudio className={ICON} />,
        title: "Déposez",
        text: "Un transcript ou un enregistrement, en un clic.",
      },
      {
        icon: <Clock className={ICON} />,
        title: "Gagnez du temps",
        text: "Compte rendu, mail de suivi et prochaines actions sont prêts.",
      },
      {
        icon: <Gauge className={ICON} />,
        title: "Progressez",
        text: "Votre score, et un conseil précis pour la suite.",
      },
    ],
  },
  2: {
    title: "Un rendez-vous enregistré, c'est un rendez-vous analysé",
    points: [
      {
        icon: <Video className={ICON} />,
        title: "En visio",
        text: "La transcription de Teams, Zoom ou Meet.",
      },
      {
        icon: <Mic className={ICON} />,
        title: "En face à face",
        text: "Le dictaphone de votre téléphone suffit.",
      },
      {
        icon: <ShieldAlert className={ICON} />,
        title: "Toujours",
        text: "Prévenir votre interlocuteur, et démarrer dès le bonjour.",
      },
    ],
  },
  3: {
    title: "Un score pour progresser, pas pour juger",
    points: [
      {
        icon: <BarChart3 className={ICON} />,
        title: "Sur 100, en cinq blocs",
        text: "Du contexte du compte jusqu'à la suite du rendez-vous.",
      },
      {
        icon: <Gauge className={ICON} />,
        title: "De 0 à 4 par critère",
        text: "La question posée, et la réponse précise obtenue.",
      },
      {
        icon: <Mic className={ICON} />,
        title: "Mesurée, pas devinée",
        text: "Votre écoute et vos questions sont comptées.",
      },
    ],
  },
  4: {
    title: "Ce que vous récupérez après chaque rendez-vous",
    points: [
      {
        icon: <FileText className={ICON} />,
        title: "Votre compte rendu",
        text: "Détaillé, prêt pour votre CRM en 15 secondes.",
      },
      {
        icon: <Mail className={ICON} />,
        title: "Votre mail de suivi",
        text: "À envoyer simplement à votre prospect ou client.",
      },
      {
        icon: <BarChart3 className={ICON} />,
        title: "Votre score",
        text: "Et la phrase à dire pour gagner des points.",
      },
    ],
  },
  5: {
    title: "Prêt pour lancer votre première analyse ?",
    points: [
      {
        icon: <FileAudio className={ICON} />,
        title: "Déposez un rendez-vous",
        text: "Récent ou non, il sera analysé.",
      },
      {
        icon: <Sparkles className={ICON} />,
        title: "Un mail vous prévient",
        text: "Dès que l'analyse est prête, en quelques minutes.",
      },
      {
        icon: <UserRound className={ICON} />,
        title: "Votre manager vous accompagne",
        text: "Il voit vos analyses pour vous aider à progresser.",
      },
    ],
  },
};

/**
 * Le dernier repère de l'étape 5, pour celui qui gère l'organisation : aucun
 * manager ne suit ses analyses, c'est lui qui fait venir son équipe.
 */
const MANAGER_TEAM_POINT: PanelPoint = {
  icon: <Users className={ICON} />,
  title: "Invitez votre équipe",
  text: "Depuis Paramètres, onglet Équipe, quand vous le souhaitez.",
};

function Tile({
  icon,
  title,
  tone = "violet",
  children,
}: {
  icon: ReactNode;
  title: string;
  tone?: Icon3dTone;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3.5 rounded-2xl border border-border/70 bg-card p-4 shadow-[0_1px_2px_rgba(16,12,40,0.04),0_12px_24px_-16px_rgba(60,40,140,0.25)] transition-[translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(16,12,40,0.04),0_18px_32px_-16px_rgba(60,40,140,0.35)]">
      <Icon3d tone={tone} size="md">
        {icon}
      </Icon3d>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <div className="text-muted-foreground text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

function Callout({
  icon,
  tone,
  children,
}: {
  icon: ReactNode;
  tone: Icon3dTone;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[#FFB59A]/40 bg-[linear-gradient(135deg,rgba(255,236,226,0.9),rgba(240,235,255,0.9))] p-4 text-sm leading-relaxed dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(255,122,107,0.12),rgba(108,77,255,0.12))]">
      <Icon3d tone={tone} size="sm">
        {icon}
      </Icon3d>
      <div>{children}</div>
    </div>
  );
}

function StepContent({
  step,
  firstName,
  organizationName,
  gridBlocks,
  newMeetingHref,
  forManager,
}: Pick<
  Props,
  | "step"
  | "firstName"
  | "organizationName"
  | "gridBlocks"
  | "newMeetingHref"
  | "forManager"
>) {
  if (step === 1) {
    return (
      <>
        <p className="text-muted-foreground leading-relaxed">
          Sales Time est votre assistant commercial qui s&apos;occupe de
          l&apos;après-rendez-vous : compte rendu pour votre CRM, prochaines
          actions, coaching et axes d&apos;amélioration, préparation du prochain
          rendez-vous… Tout est prêt en quelques minutes. Vous, vous vous
          concentrez sur ce qui compte : vendre.
        </p>
        <div className="grid gap-3">
          <Tile icon={<FileAudio className="size-4.5" />} title="Vous déposez">
            Le transcript ou l&apos;enregistrement de votre rendez-vous.
          </Tile>
          <Tile
            icon={<Gauge className="size-4.5" />}
            title="Sales Time analyse"
            tone="coral"
          >
            En quelques minutes : votre score, votre interlocuteur, vos points
            forts.
          </Tile>
          <Tile
            icon={<Sparkles className="size-4.5" />}
            title="Vous gagnez du temps tout en progressant"
            tone="amber"
          >
            Le compte rendu et le mail de suivi sont prêts, avec des conseils
            concrets pour la suite.
          </Tile>
        </div>
        <p className="text-muted-foreground text-sm">
          {forManager
            ? `${firstName ? `${firstName}, votre` : "Votre"} espace ${organizationName} est prêt.`
            : `${firstName ? `${firstName}, vous faites` : "Vous faites"} désormais partie de l'équipe ${organizationName}. Votre manager voit vos analyses pour vous accompagner.`}
        </p>
      </>
    );
  }
  if (step === 2) {
    return (
      <>
        <Tile
          icon={<Video className="size-4.5" />}
          title="En visio (Teams, Zoom, Meet)"
        >
          <ol className="list-decimal space-y-1 pl-4">
            <li>Lancez la transcription dès le début de la réunion.</li>
            <li>Après la réunion, téléchargez ou copiez le transcript.</li>
            <li>
              Dans Sales Time, « Nouveau rendez-vous » : collez-le ou déposez le
              fichier.
            </li>
          </ol>
        </Tile>
        <Tile
          icon={<Mic className="size-4.5" />}
          title="En face à face"
          tone="coral"
        >
          Enregistrez avec le dictaphone de votre téléphone, posé entre vous
          deux, puis déposez le fichier audio (mp3, m4a, wav…). Jusqu&apos;à 20
          Mo, soit environ 45 minutes en m4a.
        </Tile>
        <Callout icon={<ShieldAlert />} tone="coral">
          <p>
            <span className="font-semibold">
              Prévenez toujours votre interlocuteur
            </span>{" "}
            que vous enregistrez. Et lancez l&apos;enregistrement dès le bonjour
            : la façon dont vous ouvrez le rendez-vous compte dans le score.
          </p>
        </Callout>
      </>
    );
  }
  if (step === 3) {
    const max = Math.max(...gridBlocks.map((b) => b.weight), 1);
    return (
      <>
        <p className="text-muted-foreground leading-relaxed">
          Chaque rendez-vous de découverte reçoit un score sur 100, en cinq
          blocs. Chaque critère vaut de 0 à 4 points.
        </p>
        <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-[0_12px_24px_-16px_rgba(60,40,140,0.25)]">
          {gridBlocks.map((b) => (
            <div key={b.key} className="space-y-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{b.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {b.weight} pts
                </span>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className="st-bar h-full rounded-full bg-gradient-to-r from-[#7B5CFF] via-[#B26BFF] to-[#FF7A8A] shadow-[0_0_10px_rgba(178,107,255,0.45)]"
                  style={{ width: `${(b.weight / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <Callout icon={<Sparkles />} tone="amber">
          <p>
            <span className="font-semibold">Pour avoir tous les points</span>{" "}
            sur un critère : posez la question <em>et</em> obtenez une réponse
            précise du prospect, un chiffre, une date ou un nom. Votre temps de
            parole et vos questions sont mesurés automatiquement.
          </p>
        </Callout>
      </>
    );
  }
  if (step === 4) {
    return (
      <div className="grid gap-3">
        <Tile
          icon={<FileText className="size-4.5" />}
          title="Un compte rendu détaillé en 15 secondes"
        >
          Votre rendez-vous, prêt à intégrer simplement dans votre CRM.
        </Tile>
        <Tile
          icon={<Mail className="size-4.5" />}
          title="Un mail de suivi"
          tone="teal"
        >
          À envoyer simplement à votre prospect ou client.
        </Tile>
        <Tile
          icon={<BarChart3 className="size-4.5" />}
          title="Votre score et où gagner des points"
          tone="coral"
        >
          Critère par critère, avec la phrase à dire la prochaine fois.
        </Tile>
        <Tile
          icon={<UserRound className="size-4.5" />}
          title="Votre interlocuteur et ses objections"
          tone="teal"
        >
          Ce qui le fait choisir (SONCAS), sa façon de communiquer (DISC), ce
          qui le retient et comment mieux y répondre.
        </Tile>
        <Tile
          icon={<Target className="size-4.5" />}
          title="Trois défis pour le prochain rendez-vous"
          tone="amber"
        >
          Une information à obtenir, une phrase à dire, un geste à faire.
        </Tile>
      </div>
    );
  }
  return (
    <>
      <p className="text-muted-foreground leading-relaxed">
        Déposez votre premier rendez-vous. L&apos;analyse arrive en quelques
        minutes, et vous recevez un mail dès qu&apos;elle est prête.
      </p>
      <BrandCtaLink
        href={newMeetingHref}
        size="md"
        className="w-full sm:w-auto"
      >
        <FileAudio className="size-4" />
        Déposer mon premier rendez-vous
      </BrandCtaLink>
      <Tile
        icon={<FileAudio className="size-4.5" />}
        title="Pas de rendez-vous sous la main ?"
        tone="amber"
      >
        Pas de souci : vous le déposerez quand vous l&apos;aurez, depuis vos
        rendez-vous.
      </Tile>
    </>
  );
}

/**
 * Le guide de démarrage, en cinq étapes : ce qu'est Sales Time, comment
 * enregistrer un rendez-vous, comment se calcule le score, ce que l'on
 * reçoit, et le premier dépôt.
 *
 * Demande de Thomas du 21 octobre 2026 : « des pages d'onboarding pour bien
 * comprendre le process, et aider les personnes étape par étape ». Chaque
 * étape a son adresse (`?etape=`), sans état côté client.
 *
 * Depuis le 29 octobre 2026, il s'ouvre juste après la création de tout
 * compte, invité ou créateur de l'espace, et mène ensuite au tableau de bord.
 * Il parle de temps gagné avant de parler de coaching, et de score plutôt que
 * de note.
 */
export function MemberWelcomeGuide({
  step,
  firstName,
  organizationName,
  gridBlocks,
  newMeetingHref,
  dashboardHref,
  forManager = false,
}: Props) {
  const total = MEMBER_GUIDE_STEPS.length;
  const current = Math.min(Math.max(step, 1), total);
  const panel = PANEL[current];
  const points =
    current === total && forManager
      ? [...panel.points.slice(0, -1), MANAGER_TEAM_POINT]
      : panel.points;
  const heading =
    current === 1
      ? firstName
        ? `Bienvenue, ${firstName}`
        : "Bienvenue sur Sales Time"
      : current === 2
        ? "Enregistrer un rendez-vous"
        : current === 3
          ? "Comment se calcule votre score"
          : current === 4
            ? "Ce que vous recevez"
            : "À vous de jouer";
  const stepHref = (n: number) => `/bienvenue?etape=${n}`;

  return (
    <main className="grid min-h-svh grid-cols-1 bg-card lg:h-svh lg:grid-cols-2 lg:overflow-hidden">
      <OnboardingBrandPanel
        eyebrow={`Étape ${current} sur ${total}`}
        title={panel.title}
        scene={<OnboardingScene3d key={current} focus={FOCUS[current]} />}
      >
        <div className="mt-2 space-y-5">
          {points.map((p, i) => (
            <OnboardingBrandPoint
              key={p.title}
              tone={ICON_3D_TONE_CYCLE[i % ICON_3D_TONE_CYCLE.length]}
              icon={p.icon}
              title={p.title}
              text={p.text}
            />
          ))}
        </div>
      </OnboardingBrandPanel>

      <section className="flex min-h-0 flex-col overflow-y-auto bg-[radial-gradient(55%_45%_at_100%_0%,rgba(255,138,91,0.09),transparent),radial-gradient(50%_40%_at_0%_100%,rgba(108,77,255,0.08),transparent)] px-6 py-8 sm:px-10">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.25 lg:invisible">
              <SalesTimeLogoMark size="sm" />
              <span className="text-[15px] font-bold tracking-tight text-foreground">
                Sales Time
              </span>
            </div>
            <Link
              href={dashboardHref}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Passer le guide
            </Link>
          </div>

          <OnboardingMobileHero focus={FOCUS[current]} />

          <StepRail
            steps={MEMBER_GUIDE_STEPS}
            current={current}
            className="mb-8"
          />

          <div key={current} className="st-enter flex-1 space-y-5">
            <h1 className={pageTitleClass}>{heading}</h1>
            <StepContent
              step={current}
              firstName={firstName}
              organizationName={organizationName}
              gridBlocks={gridBlocks}
              newMeetingHref={newMeetingHref}
              forManager={forManager}
            />
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
            {current > 1 ? (
              <BrandCtaLink href={stepHref(current - 1)} variant="outline">
                <ArrowLeft className="size-4" />
                Précédent
              </BrandCtaLink>
            ) : (
              <span />
            )}
            {current < total ? (
              <BrandCtaLink href={stepHref(current + 1)}>
                Suivant
                <ArrowRight className="size-4" />
              </BrandCtaLink>
            ) : (
              <BrandCtaLink href={dashboardHref} variant="outline">
                Voir mon tableau de bord
                <ArrowRight className="size-4" />
              </BrandCtaLink>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
