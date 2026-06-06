import { LandingReveal } from "@/components/atoms/landing-reveal";
import { LandingFeatureCard } from "@/components/molecules/landing-feature-card";
import { LandingSectionHeading } from "@/components/molecules/landing-section-heading";
import { landingFeatureCards } from "@/lib/landing-content";

export function LandingFeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-24 bg-white py-[88px]"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-[1160px] px-6 sm:px-10">
        <LandingSectionHeading
          label="Fonctionnalités"
          title={
            <>
              Tout ce dont votre équipe
              <br />
              a besoin, <em>dès le départ</em>
            </>
          }
        />

        <div className="mt-[52px] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200">
          <div className="grid gap-px md:grid-cols-2">
            {landingFeatureCards.map((feature, index) => (
              <LandingReveal key={feature.title} delay={(index % 4) as 0 | 1 | 2 | 3}>
                <LandingFeatureCard
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                />
              </LandingReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
