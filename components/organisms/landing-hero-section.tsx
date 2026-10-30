import Link from "next/link";
import { Play } from "lucide-react";
import { LandingReveal } from "@/components/atoms/landing-reveal";
import { LandingGridOverlay } from "@/components/atoms/landing-grid-overlay";
import { LandingStatStrip } from "@/components/molecules/landing-stat-strip";
import { LandingHeroAppMockup } from "@/components/organisms/landing-hero-app-mockup";
import { landingHeroStats } from "@/lib/landing-content";

export function LandingHeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#06060A] pt-[60px]"
    >
      <LandingGridOverlay />
      <div
        className="pointer-events-none absolute top-[-80px] left-1/2 h-[600px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_30%,rgba(79,85,240,0.22)_0%,transparent_68%)]"
        aria-hidden
      />

      <div className="relative z-[2] flex w-full max-w-[1160px] flex-col items-center px-6 pt-[72px] pb-0 sm:px-10">
        {/*
          La promesse d'abord, en plus gros : Sales Time vend du temps au
          commercial, le coaching en est un moyen (retour de Thomas du
          29 octobre 2026).
        */}
        <LandingReveal delay={1}>
          <h1 className="max-w-[1100px] text-center text-[clamp(40px,4.6vw,66px)] leading-[1.06] font-extrabold tracking-tight text-balance text-white">
            Vous vendez.
            <br />
            <em className="text-brand-muted not-italic">Sales Time</em>{" "}
            s&apos;occupe du reste.
          </h1>
        </LandingReveal>

        <LandingReveal delay={2}>
          <p className="mt-5 text-center text-[clamp(20px,2.2vw,28px)] leading-snug font-semibold tracking-tight text-balance text-white/85">
            L&apos;assistant commercial de votre équipe
          </p>
          <p className="mx-auto mt-6 max-w-[620px] text-center text-base leading-[1.7] text-white/60">
            <span className="font-semibold text-white/85">
              La fin de la corvée administrative :
            </span>{" "}
            moins de reporting, moins de CRM à remplir, moins de propales à
            préparer. Sales Time automatise vos tâches commerciales pour vous
            rendre du temps à consacrer à vos clients. Plus de temps commercial
            utile = plus de croissance, c&apos;est notre conviction.
          </p>
          <p className="mx-auto mt-4 max-w-[500px] text-center text-lg leading-[1.65] font-normal text-white/45">
            Chaque RDV devient un compte rendu structuré, un coaching
            personnalisé et un mail de suivi, en quelques minutes.
          </p>
        </LandingReveal>

        <LandingReveal delay={3}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-semibold text-brand-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_4px_16px_rgba(79,85,240,0.4)] transition-[filter,transform] hover:brightness-108 hover:-translate-y-px"
            >
              <Play className="size-3.5 fill-current" strokeWidth={2.2} />
              Essayer Gratuitement
            </Link>
          </div>
        </LandingReveal>

        <LandingReveal delay={4} className="mt-14 w-full flex justify-center">
          <LandingStatStrip stats={landingHeroStats} />
        </LandingReveal>

        <LandingReveal className="mt-12 w-full flex justify-center">
          <LandingHeroAppMockup />
        </LandingReveal>
      </div>
    </section>
  );
}
