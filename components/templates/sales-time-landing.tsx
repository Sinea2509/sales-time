import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  Mail,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LandingSiteFooter } from "@/components/organisms/landing-site-footer";
import { LandingSiteHeader } from "@/components/organisms/landing-site-header";

const personas = [
  {
    title: "Commercial",
    subtitle: "Gagnez du TUC",
    description:
      "Compte rendu structuré, coaching KISS (Keep / Improve / Stop / Start), mail de suivi prêt à envoyer, profil prospect DISC et SONCAS — sans repasser des heures sur le CRM.",
    icon: Target,
  },
  {
    title: "Manager",
    subtitle: "Pilotez la qualité",
    description:
      "Vue équipe sur le volume de RDV coachés, les axes de coaching collectifs et les signaux de risque sur les deals — sans micro-management ni lecture ligne par ligne.",
    icon: Users,
  },
  {
    title: "Direction",
    subtitle: "Mesurez le ROI",
    description:
      "Indicateurs consolidés : TUC, TAM, volume de RDV analysés et thématiques récurrentes. Un argument ROI clair pour piloter l’investissement commercial.",
    icon: BarChart3,
  },
] as const;

const steps = [
  {
    n: 1,
    title: "Collez votre transcript",
    body: "Après le RDV, importez ou collez le texte issu de votre visio ou enregistrement.",
  },
  {
    n: 2,
    title: "L’IA génère la fiche RDV",
    body: "Synthèse, coaching KISS, profil prospect DISC / SONCAS avec verbatims, estimation du temps gagné — en quelques secondes.",
  },
  {
    n: 3,
    title: "Suivez vos progrès",
    body: "Retrouvez sur votre tableau de bord le cumul TAM, vos tendances et les prochaines actions à prioriser.",
  },
] as const;

const featureCards = [
  {
    title: "Fiche RDV analysée",
    description:
      "Métadonnées, synthèse du contexte et des enjeux, pistes de solution — prêt à partager ou à archiver.",
    icon: ClipboardList,
  },
  {
    title: "Coaching KISS personnalisé",
    description:
      "Recommandations adaptées au profil du prospect : ce qu’il faut garder, améliorer, arrêter et commencer — y compris une golden question pour le prochain échange.",
    icon: Sparkles,
  },
  {
    title: "Mail de suivi client",
    description:
      "Génération d’un mail structuré (remerciement, rappel des enjeux, prochaines étapes) modifiable avant envoi.",
    icon: Mail,
  },
  {
    title: "Dashboard manager",
    description:
      "Vue équipe : volumes, TAM agrégé, répartition des types de RDV et thématiques KISS — sans exposer les notes individuelles.",
    icon: TrendingUp,
  },
] as const;

export function SalesTimeLanding() {
  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.28] dark:opacity-20"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(ellipse 75% 45% at 50% -15%, color-mix(in srgb, var(--brand) 22%, transparent), transparent),
            linear-gradient(to right, oklch(0 0 0 / 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(0 0 0 / 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 28px 28px, 28px 28px",
        }}
      />
      <LandingSiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-18 sm:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-muted-foreground mb-3 text-xs font-medium tracking-[0.2em] uppercase">
              Coach commercial IA
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.08]">
              Le directeur commercial virtuel qui transforme vos RDV en{" "}
              <span className="text-brand">performance</span>
            </h1>
            <p className="text-muted-foreground mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-pretty sm:text-xl">
              Votre Coach Commercial IA transforme chaque RDV en compte rendu,
              coaching personnalisé et mail de suivi — en 30 secondes.
            </p>

            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex min-w-[220px] justify-center border-0 bg-brand px-8 text-white shadow-md hover:bg-brand-hover",
                )}
              >
                Essayer gratuitement
              </Link>
              <Link
                href="/company/plan"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "inline-flex min-w-[220px] justify-center border-border/90 bg-background/90 px-8 backdrop-blur",
                )}
              >
                Voir une démo
              </Link>
            </div>
          </div>
        </section>

        {/* Social proof placeholder */}
        <section
          className="border-border/80 bg-muted/25 border-y py-8"
          aria-label="Références clients"
        >
          <div className="text-muted-foreground mx-auto max-w-6xl px-4 text-center text-sm sm:px-6">
            <p className="font-medium text-foreground/80">
              Conçu pour les équipes commerciales B2B
            </p>
            <p className="mt-1 text-xs sm:text-sm">
              Espace réservé aux logos clients — votre marque ici bientôt.
            </p>
          </div>
        </section>

        {/* Personas */}
        <section
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
          aria-labelledby="personas-heading"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="personas-heading"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Une plateforme, trois regards
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base">
              Commercial, manager et direction : chacun y trouve ce dont il a
              besoin pour avancer, sans surcharger l’interface.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {personas.map(({ title, subtitle, description, icon: Icon }) => (
              <Card
                key={title}
                className="border-border/80 bg-card/85 shadow-sm backdrop-blur transition-shadow hover:shadow-md"
              >
                <CardHeader className="gap-3">
                  <div className="bg-brand/12 text-brand flex size-10 items-center justify-center rounded-lg">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <p className="text-brand text-xs font-semibold uppercase tracking-wide">
                    {subtitle}
                  </p>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section
          id="comment-ca-marche"
          className="border-border bg-muted/20 border-y py-16 sm:py-20"
          aria-labelledby="steps-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2
              id="steps-heading"
              className="text-center text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Comment ça marche
            </h2>
            <ol className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="flex flex-col items-center text-center">
                  <span className="bg-brand text-primary-foreground mb-4 flex size-10 items-center justify-center rounded-full text-sm font-bold shadow-sm">
                    {s.n}
                  </span>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Feature grid */}
        <section
          className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
          aria-labelledby="features-heading"
        >
          <h2
            id="features-heading"
            className="text-center text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            Fonctionnalités clés
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-center text-sm sm:text-base">
            MVP orienté terrain : transcript, analyse, coaching, suivi — les
            intégrations CRM profondes arrivent en phase suivante.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {featureCards.map(({ title, description, icon: Icon }) => (
              <Card
                key={title}
                className="border-border/80 bg-card/80 shadow-sm backdrop-blur transition-shadow hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-start gap-4 sm:gap-5">
                  <div className="bg-brand/10 text-brand flex size-11 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-border bg-muted/30 border-t py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Prêt à transformer vos RDV ?
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base">
              Créez votre espace, invitez votre équipe et lancez la première
              analyse en quelques minutes.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex justify-center border-0 bg-brand px-10 text-white hover:bg-brand-hover",
                )}
              >
                Créer un compte
              </Link>
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "inline-flex justify-center px-10",
                )}
              >
                Connexion
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingSiteFooter />
    </div>
  );
}
