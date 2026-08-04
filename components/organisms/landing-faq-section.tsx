"use client";

import { useState } from "react";
import { LandingSectionHeading } from "@/components/molecules/landing-section-heading";
import { LandingFaqItem } from "@/components/molecules/landing-faq-item";
import { landingFaqItems } from "@/lib/landing-content";

export function LandingFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="scroll-mt-24 bg-card py-[88px]"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-[1160px] px-6 sm:px-10">
        <div className="mb-[52px] text-center">
          <LandingSectionHeading
            label="FAQ"
            title="Questions fréquentes"
            description="Les réponses essentielles avant de lancer un pilote."
            align="center"
            className="[&_p]:mx-auto"
          />
        </div>
        <div className="mx-auto flex max-w-[740px] flex-col gap-2">
          {landingFaqItems.map((item, index) => (
            <LandingFaqItem
              key={item.q}
              question={item.q}
              answer={item.a}
              open={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
