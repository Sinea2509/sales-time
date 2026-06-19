import Link from "next/link";
import { SalesTimeLogoMark } from "@/components/atoms/sales-time-logo-mark";
import { LandingGridOverlay } from "@/components/atoms/landing-grid-overlay";
import { LandingHeroBadge } from "@/components/molecules/landing-hero-badge";
import { LandingStatStrip } from "@/components/molecules/landing-stat-strip";
import { LandingHeroAppMockup } from "@/components/organisms/landing-hero-app-mockup";
import { landingHeroStats } from "@/lib/landing-content";

/** Homepage-branded art column for sign-in split layout. */
export function SignInBrandPanel() {
  return (
    <section className="relative hidden h-full min-h-0 overflow-hidden bg-[#06060A] lg:flex lg:flex-col">
      <LandingGridOverlay />
      <div
        className="pointer-events-none absolute top-[-80px] left-1/2 h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_30%,rgba(108,77,255,0.22)_0%,transparent_68%)]"
      />

      <div className="relative z-[2] flex min-h-0 h-full flex-1 flex-col overflow-hidden px-8 py-8 xl:px-12">
        <Link href="/" className="flex shrink-0 items-center gap-2.25">
          <SalesTimeLogoMark />
          <span className="text-[15px] font-bold tracking-tight text-white">
            Sales Time
          </span>
        </Link>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto py-6">
          <LandingHeroBadge>
            Coach commercial IA · Analyse DISC &amp; SONCAS
          </LandingHeroBadge>

          <h2
            className="mt-6 max-w-md text-center text-[clamp(28px,3.2vw,44px)] leading-[1.08] font-extrabold tracking-tight text-white"
          >
            Le directeur commercial
            <br />
            <em className="text-brand-muted not-italic">virtuel</em> de votre équipe
          </h2>

          <p className="mt-4 max-w-sm text-center text-[15px] leading-[1.65] text-white/45">
            Chaque RDV devient un compte rendu structuré, un coaching personnalisé et un
            mail de suivi — en 30 secondes.
          </p>

          <div className="mt-8 w-full max-w-md">
            <LandingStatStrip stats={landingHeroStats} />
          </div>

          <div className="mt-8 w-full max-w-[min(100%,520px)] shrink-0 overflow-hidden">
            <div className="origin-top scale-[0.68] xl:scale-[0.78]">
              <LandingHeroAppMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
