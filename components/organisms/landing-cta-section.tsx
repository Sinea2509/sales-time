import Link from "next/link";
import { LandingReveal } from "@/components/atoms/landing-reveal";
import { LandingGridOverlay } from "@/components/atoms/landing-grid-overlay";
import { LandingTrustLine } from "@/components/molecules/landing-trust-line";
import { landingCtaTrustItems } from "@/lib/landing-content";

export function LandingCtaSection() {
  return (
    <section id="cta" className="relative overflow-hidden bg-[#06060A] py-[100px]">
      <LandingGridOverlay className="bg-[linear-gradient(rgba(108,77,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(108,77,255,0.035)_1px,transparent_1px)]" />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse,rgba(108,77,255,0.18)_0%,transparent_65%)]"
        aria-hidden
      />
      <div className="relative z-[2] mx-auto max-w-[1160px] px-6 text-center sm:px-10">
        <LandingReveal>
          <h2 className="text-[clamp(32px,4vw,52px)] leading-[1.1] font-extrabold tracking-tight text-white">
            Prêt à transformer
            <br />
            <em className="text-brand-muted not-italic">vos rendez-vous ?</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[440px] text-[17px] leading-[1.65] text-white/40">
            Créez votre espace, invitez votre équipe et lancez la première analyse en quelques
            minutes.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center rounded-xl bg-brand px-6 text-[15px] font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_4px_16px_rgba(108,77,255,0.4)] transition-[filter,transform] hover:brightness-108 hover:-translate-y-px"
            >
              Créer un compte gratuit
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex h-12 items-center rounded-xl bg-white px-6 text-[15px] font-semibold text-zinc-950 shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#F0F0F3]"
            >
              Connexion
            </Link>
          </div>
          <LandingTrustLine
            items={landingCtaTrustItems}
            className="mt-7 text-xs text-white/22"
          />
        </LandingReveal>
      </div>
    </section>
  );
}
