import { Star } from "lucide-react";
import { LandingReveal } from "@/components/atoms/landing-reveal";
import { landingTestimonial } from "@/lib/landing-content";

export function LandingTestimonialSection() {
  const { quote, name, role, initials, stats } = landingTestimonial;

  return (
    <section
      id="testi"
      className="scroll-mt-24 bg-zinc-50 py-[88px]"
      aria-label="Témoignage"
    >
      <div className="mx-auto max-w-[860px] px-6 sm:px-10">
        <LandingReveal>
          <div className="text-center">
            <div className="mb-7 flex justify-center gap-0.75" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="size-[18px] fill-amber-600 text-amber-600"
                />
              ))}
            </div>
            <blockquote className="text-[clamp(22px,2.8vw,34px)] leading-[1.45] font-semibold tracking-tight text-pretty text-zinc-950">
              <span className="text-brand text-[1.4em] leading-[0.6] align-[-0.3em]">
                &ldquo;
              </span>
              {quote}
              <span className="text-brand text-[1.4em] leading-[0.6] align-[-0.3em]">
                &rdquo;
              </span>
            </blockquote>
            <div className="mt-9 flex items-center justify-center gap-3.5">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
                {initials}
              </span>
              <div className="text-left">
                <p className="text-sm font-semibold text-zinc-950">{name}</p>
                <p className="text-[13px] text-zinc-500">{role}</p>
              </div>
            </div>
            <div className="mt-[52px] flex flex-col border-y border-zinc-200 sm:flex-row">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex-1 border-b border-zinc-200 px-6 py-7 text-center last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
                >
                  <p className="text-4xl font-bold tracking-tight text-zinc-950">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[13px] text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </LandingReveal>
      </div>
    </section>
  );
}
