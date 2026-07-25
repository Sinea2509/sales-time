import Link from "next/link";
import { Play } from "lucide-react";
import { LandingReveal } from "@/components/atoms/landing-reveal";
import { LandingGridOverlay } from "@/components/atoms/landing-grid-overlay";
import { LandingHeroBadge } from "@/components/molecules/landing-hero-badge";
import { LandingStatStrip } from "@/components/molecules/landing-stat-strip";
import { LandingTrustLine } from "@/components/molecules/landing-trust-line";
import { LandingHeroAppMockup } from "@/components/organisms/landing-hero-app-mockup";
import { landingHeroStats, landingTrustItems } from "@/lib/landing-content";

export function LandingHeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#06060A] pt-[60px]"
    >
      <LandingGridOverlay />
      <div
        className="pointer-events-none absolute top-[-80px] left-1/2 h-[600px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_30%,rgba(108,77,255,0.22)_0%,transparent_68%)]"
        aria-hidden
      />

      <div className="relative z-[2] flex w-full max-w-[1160px] flex-col items-center px-6 pt-[72px] pb-0 sm:px-10">
        <LandingReveal>
          <LandingHeroBadge>
            Coach commercial IA · Analyse DISC &amp; SONCAS
          </LandingHeroBadge>
        </LandingReveal>

        <LandingReveal delay={1}>
          <h1 className="mt-7 max-w-[840px] text-center text-[clamp(44px,5.5vw,76px)] leading-[1.06] font-extrabold tracking-tight text-white">
            Le directeur commercial
            <br />
            <em className="text-brand-muted not-italic">virtuel</em> de votre
            équipe
          </h1>
        </LandingReveal>

        <LandingReveal delay={2}>
          <p className="mt-5.5 max-w-[500px] text-center text-lg leading-[1.65] font-normal text-white/45">
            Chaque RDV devient un compte rendu structuré, un coaching
            personnalisé et un mail de suivi — en 30 secondes.
          </p>
        </LandingReveal>

        <LandingReveal delay={3}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-semibold text-brand-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_4px_16px_rgba(108,77,255,0.4)] transition-[filter,transform] hover:brightness-108 hover:-translate-y-px"
            >
              <Play className="size-3.5 fill-current" strokeWidth={2.2} />
              Essayer Gratuitement
            </Link>
            <Link
              href="/company/plan"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-6 text-[15px] font-medium text-white/65 transition-all hover:bg-white/10 hover:text-white"
            >
              Voir les offres
            </Link>
          </div>
        </LandingReveal>

        <LandingReveal delay={3} className="mt-4.5 w-full">
          <LandingTrustLine items={landingTrustItems} />
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
