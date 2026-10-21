import type { ReactNode } from "react";
import { SalesTimeLogoMark } from "@/components/atoms/sales-time-logo-mark";
import { LandingGridOverlay } from "@/components/atoms/landing-grid-overlay";

type Props = {
  /** Petit libellé au-dessus du titre. */
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
};

/**
 * La colonne sombre, aux couleurs de Sales Time, des pages d'arrivée
 * (invitation, guide de démarrage) : la même que la page de connexion, avec
 * un titre et un contenu propres à l'étape. Masquée sur mobile.
 */
export function OnboardingBrandPanel({ eyebrow, title, children }: Props) {
  return (
    <section className="relative hidden h-full min-h-0 overflow-hidden bg-[#06060A] lg:flex lg:flex-col">
      <LandingGridOverlay />
      <div className="pointer-events-none absolute top-[-80px] left-1/2 h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_30%,rgba(108,77,255,0.25)_0%,transparent_68%)]" />
      <div className="relative z-[2] flex h-full min-h-0 flex-col px-10 py-10 xl:px-14">
        <div className="flex shrink-0 items-center gap-2.25">
          <SalesTimeLogoMark />
          <span className="text-[15px] font-bold tracking-tight text-white">
            Sales Time
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-6 py-8">
          {eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.18em] text-[#A99BFF] uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="max-w-md text-[34px] leading-[1.15] font-semibold tracking-tight text-white">
            {title}
          </h2>
          {children ? (
            <div className="max-w-md text-[15px] leading-relaxed text-white/70">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Une ligne d'avantage dans le panneau : une pastille violette et un texte. */
export function OnboardingBrandPoint({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[rgba(108,77,255,0.18)] text-[#C4B8FF]">
        {icon}
      </span>
      <div>
        <p className="text-[15px] font-medium text-white">{title}</p>
        <p className="text-sm text-white/60">{text}</p>
      </div>
    </div>
  );
}
