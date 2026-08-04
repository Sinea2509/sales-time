import { LandingLogoChip } from "@/components/molecules/landing-logo-chip";
import { landingCustomerBrands } from "@/lib/landing-content";

export function LandingLogosSection() {
  return (
    <section
      id="logos"
      className="border-y border-border bg-muted py-11"
      aria-label="Clients"
    >
      <div className="mx-auto flex max-w-[1160px] flex-col items-center gap-6 px-6 sm:px-10">
        <p className="text-[11.5px] font-semibold tracking-[0.07em] text-muted-foreground uppercase">
          Ils utilisent Sales Time
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10">
          {landingCustomerBrands.map((brand) => (
            <LandingLogoChip
              key={brand.name}
              initials={brand.initials}
              name={brand.name}
              color={brand.color}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
