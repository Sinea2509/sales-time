import { LandingReveal } from "@/components/atoms/landing-reveal";
import { LandingGridOverlay } from "@/components/atoms/landing-grid-overlay";
import { LandingHowStep } from "@/components/molecules/landing-how-step";
import { LandingSectionHeading } from "@/components/molecules/landing-section-heading";
import { landingHowSteps } from "@/lib/landing-content";

export function LandingHowSection() {
  return (
    <section
      id="how"
      className="relative scroll-mt-24 overflow-hidden bg-[#06060A] py-[88px]"
      aria-labelledby="how-heading"
    >
      <LandingGridOverlay className="bg-[linear-gradient(rgba(108,77,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(108,77,255,0.035)_1px,transparent_1px)]" />
      <div className="relative mx-auto max-w-[1160px] px-6 sm:px-10">
        <LandingSectionHeading
          label="Simple par design"
          labelVariant="dark"
          title={
            <>
              Comment <em className="text-brand-muted">ça marche</em>
            </>
          }
          description="Trois étapes, zéro friction — de la fin du RDV à la fiche structurée."
          className="[&_h2]:text-white [&_p]:max-w-[440px] [&_p]:text-white/38"
        />

        <div className="relative mt-[52px] grid gap-px lg:grid-cols-3">
          {landingHowSteps.map((step, index) => (
            <LandingReveal key={step.step} delay={index as 0 | 1 | 2}>
              <LandingHowStep
                step={step.step}
                title={step.title}
                description={step.description}
                icon={step.icon}
                showArrow={index < landingHowSteps.length - 1}
              />
            </LandingReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
