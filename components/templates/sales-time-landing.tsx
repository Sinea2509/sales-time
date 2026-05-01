import Link from "next/link";
import {
  FileText,
  ImageIcon,
  LayoutDashboard,
  LineChart,
  Mail,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cardTitleClass, pageTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LandingSiteFooter } from "@/components/organisms/landing-site-footer";
import { LandingSiteHeader } from "@/components/organisms/landing-site-header";
import { LandingTestimonialSlider } from "@/components/organisms/landing-testimonial-slider";
import {
  landingTestimonialSlides,
  LANDING_TESTIMONIAL_INTERVAL_MS,
} from "@/lib/landing-testimonials";

const personas = [
  {
    title: "Commercial",
    subtitle: "Gagnez du TUC",
    description:
      "Compte rendu structuré, coaching KISS (Keep / Improve / Stop / Start), mail de suivi prêt à envoyer, profil prospect DISC et SONCAS — sans repasser des heures sur le CRM.",
    icon: Target,
    cover: "from-zinc-200 to-zinc-400 dark:from-zinc-700 dark:to-zinc-900",
    iconBg: "bg-brand/10 text-brand",
  },
  {
    title: "Manager",
    subtitle: "Pilotez la qualité",
    description:
      "Vue équipe sur le volume de RDV coachés, les axes de coaching collectifs et les signaux de risque sur les deals — sans micro-management ni lecture ligne par ligne.",
    icon: Users,
    cover: "from-zinc-300 to-zinc-500 dark:from-zinc-600 dark:to-zinc-800",
    iconBg: "bg-brand/10 text-brand",
  },
  {
    title: "Direction",
    subtitle: "Mesurez le ROI",
    description:
      "Indicateurs consolidés : TUC, TAM, volume de RDV analysés et thématiques récurrentes. Un argument ROI clair pour piloter l’investissement commercial.",
    icon: LineChart,
    cover: "from-zinc-200 to-zinc-500 dark:from-zinc-700 dark:to-zinc-900",
    iconBg: "bg-brand/10 text-brand",
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
    icon: FileText,
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
    icon: LayoutDashboard,
  },
] as const;

const customerBrands = [
  { initials: "NV", name: "Novalis ERP", hint: "SaaS industrie" },
  { initials: "KM", name: "Kermor Media", hint: "Agences & retail" },
  { initials: "BX", name: "Bexon Logistique", hint: "Transport B2B" },
  { initials: "AR", name: "Archetype Labs", hint: "Deep tech" },
  { initials: "ML", name: "Maillon Santé", hint: "Medtech" },
  { initials: "CT", name: "Côté Terre", hint: "Matériaux & construction" },
] as const;

const impactStats = [
  { value: "30 s", label: "Pour une première analyse" },
  { value: "5+", label: "Frameworks (KISS, DISC…)" },
  { value: "100 %", label: "Données restent les vôtres" },
  { value: "24/7", label: "Disponible après chaque RDV" },
] as const;

const faqItems = [
  {
    q: "Mes transcripts et analyses sont-ils confidentiels ?",
    a: "Oui. Les contenus sont traités pour votre organisation et vos rôles (commercial, manager, admin). Nous recommandons d’anonymiser les données personnelles sensibles si votre politique interne l’exige.",
  },
  {
    q: "Faut-il une intégration CRM pour commencer ?",
    a: "Non. Vous collez le transcript ou le texte issu de votre visio / enregistrement. Les intégrations CRM plus poussées pourront enrichir le flux dans une phase ultérieure.",
  },
  {
    q: "L’IA remplace-t-elle le manager commercial ?",
    a: "Non. L’outil accélère la structuration et le feedback, mais la décision, la relation client et le coaching humain restent au centre.",
  },
  {
    q: "Quels formats de transcript sont acceptés ?",
    a: "Tout texte brut : export visio, transcription automatique, prise de notes. L’important est un minimum de contexte (parties, sujets abordés).",
  },
  {
    q: "Puis-je inviter toute l’équipe ?",
    a: "Oui. Créez votre organisation, définissez les rôles admin / membre et invitez vos collègues par e-mail depuis l’espace équipe.",
  },
] as const;

/** Aperçu produit : tons neutres + accent brand léger. */
function LandingProductMockup() {
  const bars = [40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 48, 90];
  return (
    <div
      className="border-border/80 relative overflow-hidden rounded-2xl border bg-zinc-900 p-1 shadow-xl dark:bg-zinc-950"
      role="img"
      aria-label="Illustration : aperçu du tableau de bord Sales Time"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_70%_0%,color-mix(in_srgb,var(--brand)_18%,transparent),transparent)]" />
      <div className="relative rounded-xl bg-zinc-950/90 p-4 dark:bg-black/60">
        <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
          <span className="size-2.5 rounded-full bg-zinc-500" />
          <span className="size-2.5 rounded-full bg-zinc-500" />
          <span className="size-2.5 rounded-full bg-zinc-500" />
          <span className="ml-2 flex flex-1 items-center gap-2 rounded-md bg-white/5 px-3 py-1 text-[10px] text-zinc-400">
            <LayoutDashboard className="text-brand size-3" />
            app.sales-time.io / tableau de bord
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-brand/90 text-[10px] font-medium tracking-wide uppercase">
              TAM cumulé · 30 jours
            </p>
            <div className="flex h-24 items-end gap-1">
              {bars.slice(0, 8).map((h, i) => (
                <div
                  key={i}
                  className="from-brand to-brand-hover flex-1 rounded-t-sm bg-gradient-to-t opacity-80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-medium text-zinc-300">KISS</p>
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-zinc-400/70" />
              <div className="h-2 w-4/5 rounded-full bg-white/15" />
              <div className="h-2 w-3/5 rounded-full bg-white/10" />
              <div className="h-2 w-full rounded-full bg-zinc-500/60" />
            </div>
            <div className="mt-3 flex items-center justify-center rounded-lg border border-dashed border-white/15 py-6">
              <ImageIcon className="size-8 text-white/20" aria-hidden />
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="mb-2 h-2 w-1/3 rounded bg-brand/40" />
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded bg-white/10" />
              <div className="h-1.5 w-5/6 rounded bg-white/10" />
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="mb-2 h-2 w-1/4 rounded bg-white/20" />
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded bg-white/10" />
              <div className="h-1.5 w-4/5 rounded bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingTeamPlaceholder() {
  return (
    <div
      className="border-border/60 relative aspect-[21/9] w-full overflow-hidden rounded-2xl border bg-gradient-to-r from-muted via-background to-muted shadow-inner"
      role="img"
      aria-label="Illustration : équipe commerciale (placeholder)"
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-90" />
      <div className="absolute inset-0 flex items-center justify-center gap-4 sm:gap-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-background/80 flex size-14 shrink-0 items-center justify-center rounded-full border-2 bg-zinc-600 text-lg font-bold text-white shadow-md sm:size-16 sm:text-2xl dark:bg-zinc-700"
          >
            {["SL", "TM", "KR", "JD"][i]}
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-black/40 px-3 py-2 text-[10px] text-white backdrop-blur-sm sm:text-xs">
        <span className="font-medium">Espace équipe · coaching partagé</span>
        <span className="text-white/70">Visuel indicatif</span>
      </div>
    </div>
  );
}

export function SalesTimeLanding() {
  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-50 dark:opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in srgb, var(--brand) 14%, transparent), transparent),
              linear-gradient(to right, oklch(0 0 0 / 0.035) 1px, transparent 1px),
              linear-gradient(to bottom, oklch(0 0 0 / 0.035) 1px, transparent 1px)
            `,
            backgroundSize: "100% 100%, 28px 28px, 28px 28px",
          }}
        />
      </div>
      <LandingSiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-14">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
            <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
              <span className="text-muted-foreground mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium tracking-wide">
                <Sparkles className="text-brand size-3.5" aria-hidden />
                Coach commercial IA
              </span>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.08]">
                Le directeur commercial virtuel qui transforme vos RDV en{" "}
                <span className="text-brand">performance</span>
              </h1>
              <p className="text-muted-foreground mt-5 text-lg leading-relaxed text-pretty sm:text-xl">
                Votre Coach Commercial IA transforme chaque RDV en compte rendu,
                coaching personnalisé et mail de suivi — en 30 secondes.
              </p>

              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href="/sign-up"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "inline-flex min-w-[200px] justify-center border-0 bg-brand px-8 text-white shadow-md hover:bg-brand-hover",
                  )}
                >
                  Essayer gratuitement
                </Link>
                <Link
                  href="/company/plan"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "inline-flex min-w-[200px] justify-center px-8",
                  )}
                >
                  Voir les offres
                </Link>
              </div>
              <p className="text-muted-foreground mt-6 text-xs sm:text-sm">
                Essai gratuit · Pas de carte bancaire pour démarrer · Équipes
                B2B
              </p>
            </div>
            <div className="mx-auto w-full max-w-lg lg:max-w-none">
              <LandingProductMockup />
            </div>
          </div>
        </section>

        <section
          className="border-border/60 border-y bg-muted/25 py-10"
          aria-label="Indicateurs clés"
        >
          <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {impactStats.map((s) => (
              <div
                key={s.label}
                className="border-border/60 bg-card rounded-2xl border p-5 text-center shadow-sm"
              >
                <p className="text-brand text-3xl font-semibold tabular-nums sm:text-4xl">
                  {s.value}
                </p>
                <p className="text-muted-foreground mt-2 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="mx-auto max-w-6xl px-4 py-10 sm:px-6"
          aria-label="Illustration équipe"
        >
          <LandingTeamPlaceholder />
        </section>

        <section
          id="references"
          className="scroll-mt-24 border-border/60 bg-muted/15 py-14 sm:py-16"
          aria-labelledby="references-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="references-heading" className={pageTitleClass}>
                Conçu pour les équipes qui vivent du terrain
              </h2>
              <p className="text-muted-foreground mt-3 text-sm sm:text-base">
                Des structures de la PME au scale-up : même exigence sur la
                qualité du suivi et la vitesse d’exécution.
              </p>
            </div>
            <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-center text-xs">
              Logos illustratifs — marques fictives pour présenter le rendu
              visuel.
            </p>
            <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {customerBrands.map((b) => (
                <li key={b.name}>
                  <div className="border-border/60 bg-card flex flex-col items-center justify-center rounded-xl border px-3 py-5 text-center shadow-sm transition-shadow hover:shadow-md">
                    <span className="bg-zinc-800 flex size-12 items-center justify-center rounded-xl text-sm font-bold tracking-tight text-white dark:bg-zinc-700">
                      {b.initials}
                    </span>
                    <span className="mt-3 text-xs font-semibold text-foreground">
                      {b.name}
                    </span>
                    <span className="text-muted-foreground mt-0.5 text-[10px]">
                      {b.hint}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20"
          aria-labelledby="personas-heading"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="personas-heading" className={pageTitleClass}>
              Une plateforme, trois regards
            </h2>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base">
              Commercial, manager et direction : chacun y trouve ce dont il a
              besoin pour avancer, sans surcharger l’interface.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {personas.map(
              ({ title, subtitle, description, icon: Icon, cover, iconBg }) => (
                <Card
                  key={title}
                  className="border-border/60 overflow-hidden bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    className={cn(
                      "relative aspect-[16/9] w-full bg-gradient-to-br",
                      cover,
                    )}
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-black/20">
                      <ImageIcon
                        className="size-11 text-white/50 drop-shadow-sm"
                        aria-hidden
                      />
                    </div>
                    <div className="absolute bottom-2 left-2 rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      Visuel placeholder
                    </div>
                  </div>
                  <CardHeader className="gap-3">
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        iconBg,
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <p className="text-brand text-xs font-semibold tracking-wide uppercase">
                      {subtitle}
                    </p>
                    <CardTitle className={cardTitleClass}>{title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ),
            )}
          </div>
        </section>

        <section
          id="comment-ca-marche"
          className="scroll-mt-24 border-border/60 border-y bg-muted/20 py-16 sm:py-20"
          aria-labelledby="steps-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2
              id="steps-heading"
              className={cn(pageTitleClass, "text-center")}
            >
              Comment ça marche
            </h2>
            <div className="relative mx-auto mt-12 max-w-4xl">
              <div
                className="absolute top-8 right-[calc(16.666%-1rem)] left-[calc(16.666%-1rem)] hidden h-px bg-border sm:block"
                aria-hidden
              />
              <ol className="relative z-[1] grid gap-10 sm:grid-cols-3 sm:gap-8">
                {steps.map((s) => (
                  <li
                    key={s.n}
                    className="flex flex-col items-center text-center"
                  >
                    <span className="bg-brand text-primary-foreground mb-4 flex size-11 items-center justify-center rounded-full text-sm font-bold shadow-md ring-4 ring-brand/15">
                      {s.n}
                    </span>
                    <p className="font-semibold text-foreground">{s.title}</p>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      {s.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section
          id="fonctionnalites"
          className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20"
          aria-labelledby="features-heading"
        >
          <h2
            id="features-heading"
            className={cn(pageTitleClass, "text-center")}
          >
            Fonctionnalités clés
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-center text-sm sm:text-base">
            MVP orienté terrain : transcript, analyse, coaching, suivi — les
            intégrations CRM profondes arrivent en phase suivante.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {featureCards.map(({ title, description, icon: Icon }) => (
              <Card
                key={title}
                className="overflow-hidden rounded-xl border border-border/60 border-l-4 border-l-brand/50 bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-start gap-4 sm:gap-5">
                  <div className="bg-brand/10 text-brand flex size-11 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <CardTitle className={cardTitleClass}>{title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section
          id="temoignages"
          className="scroll-mt-24 border-border/60 border-y bg-muted/20 py-16 sm:py-20"
          aria-labelledby="temoignages-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="temoignages-heading" className={pageTitleClass}>
                Ce qu’en disent les équipes
              </h2>
              <p className="text-muted-foreground mt-3 text-sm sm:text-base">
                Un retour à la fois — défilement automatique toutes les{" "}
                {LANDING_TESTIMONIAL_INTERVAL_MS / 1000} secondes.
              </p>
            </div>
            <div className="mt-10">
              <LandingTestimonialSlider slides={landingTestimonialSlides} />
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20"
          aria-labelledby="faq-heading"
        >
          <h2 id="faq-heading" className={cn(pageTitleClass, "text-center")}>
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-center text-sm">
            Les réponses essentielles avant de lancer un pilote avec votre
            équipe.
          </p>
          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="border-border/60 bg-card group rounded-xl border shadow-sm open:border-brand/25 open:bg-muted/30"
              >
                <summary className="cursor-pointer list-none px-4 py-4 pr-10 text-sm font-semibold text-foreground outline-none marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span className="bg-brand/10 text-brand flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold">
                        ?
                      </span>
                      {item.q}
                    </span>
                    <span className="text-muted-foreground bg-muted flex size-7 shrink-0 items-center justify-center rounded-full text-lg font-light transition-transform group-open:rotate-45 group-open:text-foreground">
                      +
                    </span>
                  </span>
                </summary>
                <p className="text-muted-foreground border-border/50 border-t px-4 pb-4 pl-12 text-sm leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section
          className="border-border/60 border-t bg-muted/25 py-10"
          aria-label="Confiance"
        >
          <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center text-sm sm:px-6 sm:flex-row sm:justify-center sm:gap-12">
            <p className="max-w-xs rounded-xl border border-border/60 bg-card px-4 py-3">
              <span className="text-foreground font-medium">
                Hébergement UE
              </span>{" "}
              — infrastructure adaptée aux exigences des équipes commerciales.
            </p>
            <p className="max-w-xs rounded-xl border border-border/60 bg-card px-4 py-3">
              <span className="text-foreground font-medium">Rôles & accès</span>{" "}
              — admin, membre et super-admin pour la gestion de plateforme.
            </p>
          </div>
        </section>

        <section className="border-border/60 border-t bg-muted/30 py-16 sm:py-20">
          <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className={pageTitleClass}>Prêt à transformer vos RDV ?</h2>
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
