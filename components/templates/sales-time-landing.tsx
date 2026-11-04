import { LandingV13Cta } from "@/components/organisms/landing-v13-cta";
import { LandingV13Faq } from "@/components/organisms/landing-v13-faq";
import { LandingV13Features } from "@/components/organisms/landing-v13-features";
import { LandingV13Footer } from "@/components/organisms/landing-v13-footer";
import { LandingV13Header } from "@/components/organisms/landing-v13-header";
import { LandingV13Hero } from "@/components/organisms/landing-v13-hero";
import { LandingV13How } from "@/components/organisms/landing-v13-how";
import { LandingV13Reveal } from "@/components/organisms/landing-v13-reveal";
import { LandingV13Roles } from "@/components/organisms/landing-v13-roles";

/**
 * La landing, reproduction de la maquette « Sales Time v13 » de Thomas
 * (3 novembre 2026). La classe `st-v13` porte ce que la maquette posait sur
 * <body> : fond, encre, police et couleur des liens.
 */
export function SalesTimeLanding() {
  return (
    <div className="st-v13" style={{ minHeight: "100vh", overflowX: "hidden" }}>
      <LandingV13Header />
      <LandingV13Hero />
      <LandingV13Features />
      <LandingV13Roles />
      <LandingV13How />
      <LandingV13Faq />
      <LandingV13Cta />
      <LandingV13Footer />
      <LandingV13Reveal />
    </div>
  );
}
