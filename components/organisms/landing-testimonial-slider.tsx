"use client";

import { useEffect, useState } from "react";
import { Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LANDING_TESTIMONIAL_INTERVAL_MS,
  type LandingTestimonialSlide,
} from "@/lib/landing-testimonials";

function StarRow() {
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="size-3.5 fill-amber-400/90 text-amber-500"
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

export function LandingTestimonialSlider({
  slides,
}: {
  slides: LandingTestimonialSlide[];
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, LANDING_TESTIMONIAL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const current = slides[active]!;

  return (
    <div className="border-border/60 bg-card/80 relative overflow-hidden rounded-2xl border shadow-sm">
      <div
        key={active}
        className="animate-in fade-in-0 zoom-in-95 grid gap-8 p-6 duration-500 sm:p-8 lg:grid-cols-12 lg:items-stretch lg:gap-10"
      >
        {/* Portrait indicatif, à gauche */}
        <div className="flex justify-center lg:col-span-3 lg:justify-start">
          <div
            className={cn(
              "relative aspect-[4/5] w-full max-w-[200px] overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br shadow-inner lg:max-w-none",
              current.portrait,
            )}
            role="img"
            aria-label={`Portrait illustratif : ${current.initials}`}
          >
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <span className="text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl">
                {current.initials}
              </span>
            </div>
            <span className="absolute bottom-2 left-2 right-2 rounded bg-black/35 px-2 py-1 text-center text-[10px] font-medium text-white/95 backdrop-blur-sm">
              Visuel indicatif
            </span>
          </div>
        </div>

        {/* Témoignage, au centre */}
        <div
          className="flex flex-col justify-center lg:col-span-6"
          aria-live="polite"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <Quote className="text-brand/40 size-9 shrink-0" aria-hidden />
            <StarRow />
          </div>
          <blockquote>
            <p className="text-foreground text-base leading-relaxed sm:text-lg">
              « {current.quote} »
            </p>
          </blockquote>
          <div className="border-border/60 mt-6 border-t border-dashed pt-4">
            <p className="text-sm font-semibold">{current.role}</p>
            <p className="text-muted-foreground text-xs">{current.context}</p>
          </div>
        </div>

        {/* Indicateurs, à droite */}
        <div className="flex flex-col gap-3 lg:col-span-3">
          {current.kpis.map((k) => (
            <div
              key={k.label}
              className="border-border/60 bg-muted/40 flex flex-1 flex-col justify-center rounded-xl border px-4 py-3"
            >
              <p className="text-brand text-2xl font-semibold tabular-nums">
                {k.value}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs font-medium">
                {k.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <div
          className="border-border/60 flex justify-center gap-1.5 border-t bg-muted/20 px-4 py-3"
          role="tablist"
          aria-label="Choisir un témoignage"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Témoignage ${i + 1} sur ${slides.length}`}
              className={cn(
                "h-2 rounded-full transition-all",
                i === active
                  ? "bg-brand w-8"
                  : "bg-border hover:bg-muted-foreground/40 w-2",
              )}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
