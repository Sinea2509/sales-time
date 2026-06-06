import { LandingCtaSection } from "@/components/organisms/landing-cta-section";
import { LandingFaqSection } from "@/components/organisms/landing-faq-section";
import { LandingFeaturesSection } from "@/components/organisms/landing-features-section";
import { LandingHeroSection } from "@/components/organisms/landing-hero-section";
import { LandingHowSection } from "@/components/organisms/landing-how-section";
import { LandingLogosSection } from "@/components/organisms/landing-logos-section";
import { LandingPerspectivesSection } from "@/components/organisms/landing-perspectives-section";
import { LandingSiteFooter } from "@/components/organisms/landing-site-footer";
import { LandingSiteHeader } from "@/components/organisms/landing-site-header";
import { LandingTestimonialSection } from "@/components/organisms/landing-testimonial-section";

export function SalesTimeLanding() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-white text-zinc-950">
      <LandingSiteHeader />
      <main className="flex-1">
        <LandingHeroSection />
        <LandingLogosSection />
        <LandingPerspectivesSection />
        <LandingHowSection />
        <LandingFeaturesSection />
        <LandingTestimonialSection />
        <LandingFaqSection />
        <LandingCtaSection />
      </main>
      <LandingSiteFooter />
    </div>
  );
}
