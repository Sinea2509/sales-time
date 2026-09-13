import Link from "next/link";
import { SalesTimeLogoMark } from "@/components/atoms/sales-time-logo-mark";
import { LandingGridOverlay } from "@/components/atoms/landing-grid-overlay";
import { LandingHeroAppMockup } from "@/components/organisms/landing-hero-app-mockup";

/** Homepage-branded art column for sign-in split layout: app preview only, no scroll. */
export function SignInBrandPanel() {
  return (
    <section className="relative hidden h-full min-h-0 overflow-hidden bg-[#06060A] lg:flex lg:flex-col">
      <LandingGridOverlay />
      <div
        className="pointer-events-none absolute top-[-80px] left-1/2 h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_30%,rgba(108,77,255,0.22)_0%,transparent_68%)]"
      />

      <div className="relative z-[2] flex h-full min-h-0 flex-col overflow-hidden px-8 py-8 xl:px-12">
        <Link href="/" prefetch={false} className="flex shrink-0 items-center gap-2.25">
          <SalesTimeLogoMark />
          <span className="text-[15px] font-bold tracking-tight text-white">
            Sales Time
          </span>
        </Link>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden py-6">
          <div className="max-h-full w-full max-w-[520px] overflow-hidden">
            <LandingHeroAppMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
