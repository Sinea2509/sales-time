"use client";

import { useState } from "react";
import { LandingReveal } from "@/components/atoms/landing-reveal";
import { LandingCheckBullet } from "@/components/atoms/landing-check-bullet";
import { LandingSectionHeading } from "@/components/molecules/landing-section-heading";
import { LandingPerspectiveDirectionVisual } from "@/components/molecules/landing-perspective-direction-visual";
import { LandingPerspectiveKissVisual } from "@/components/molecules/landing-perspective-kiss-visual";
import { LandingPerspectiveManagerVisual } from "@/components/molecules/landing-perspective-manager-visual";
import { landingPerspectiveTabs } from "@/lib/landing-content";
import { cn } from "@/lib/utils";

const visuals = {
  commercial: LandingPerspectiveKissVisual,
  manager: LandingPerspectiveManagerVisual,
  direction: LandingPerspectiveDirectionVisual,
} as const;

export function LandingPerspectivesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = landingPerspectiveTabs[activeIndex]!;
  const Visual = visuals[active.id as keyof typeof visuals];

  return (
    <section id="persp" className="scroll-mt-24 bg-white py-[88px]">
      <div className="mx-auto max-w-[1160px] px-6 sm:px-10">
        <div className="mb-11 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <LandingSectionHeading
            label="Une plateforme, trois regards"
            title={
              <>
                Conçu pour <em>chaque niveau</em>
                <br />
                de l&apos;équipe commerciale
              </>
            }
          />
          <div className="flex shrink-0 flex-wrap gap-1.5">
            {landingPerspectiveTabs.map((tab, index) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "inline-flex items-center gap-1.75 rounded-[9px] border px-4 py-2.25 font-medium whitespace-nowrap transition-all",
                  index === activeIndex
                    ? "border-brand bg-brand text-white shadow-[0_2px_10px_rgba(108,77,255,0.3)] [&_svg]:opacity-100"
                    : "border-zinc-200 bg-transparent text-zinc-500 hover:border-zinc-300 [&_svg]:opacity-50",
                )}
              >
                <tab.icon className="size-3.25" strokeWidth={2.2} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid items-center gap-[60px] lg:grid-cols-2">
          <LandingReveal>
            <div>
              <h3 className="mb-3.5 text-[26px] font-bold tracking-tight text-zinc-950">
                {active.title}
              </h3>
              <p className="mb-7 text-[15.5px] leading-[1.75] text-zinc-500">
                {active.description}
              </p>
              <div className="flex flex-col gap-2.25">
                {active.bullets.map((bullet) => (
                  <LandingCheckBullet key={bullet}>{bullet}</LandingCheckBullet>
                ))}
              </div>
            </div>
          </LandingReveal>
          <LandingReveal delay={2}>
            <Visual />
          </LandingReveal>
        </div>
      </div>
    </section>
  );
}
