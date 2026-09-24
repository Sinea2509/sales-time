import { ProfileAffinityHorizontalBars } from "@/components/molecules/profile-affinity-horizontal-bars";
import { ProfileActionableAdviceSection } from "@/components/molecules/profile-actionable-advice-section";
import { cardSubsectionTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import type { ProfileActionableAdvice } from "@/src/core/domain/analysis-result-zod";

type ProfileBarItem = {
  key: string;
  label: string;
  pct: number;
  barClass: string;
  pillClass: string;
};

function DominantProfileTag({
  label,
  pillClass,
}: {
  label: string;
  pillClass: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none",
        pillClass,
      )}
    >
      {label}
    </span>
  );
}

type ProfilePrincipal = { label: string; pillClass: string };

function ProfilePanel({
  title,
  principalCaption,
  principal,
  bars,
  actionableAdvice,
  analysisPending,
  pendingLabel,
  unavailableLabel,
  legacyAdviceHint,
}: {
  title: string;
  /** « Levier principal détecté » ou « Style principal détecté ». */
  principalCaption: string;
  /** Le levier ou le style annoncé par l'analyse, celui dont parlent ses textes. */
  principal: ProfilePrincipal | null;
  bars: ProfileBarItem[] | null;
  actionableAdvice?: ProfileActionableAdvice | null;
  analysisPending: boolean;
  pendingLabel: string;
  unavailableLabel: string;
  legacyAdviceHint: string;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <h3 className={cardSubsectionTitleClass}>{title}</h3>
        {principal && bars?.length ? (
          <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            {principalCaption} :
            <DominantProfileTag
              label={principal.label}
              pillClass={principal.pillClass}
            />
          </p>
        ) : null}
      </div>
      {bars?.length ? (
        <ProfileAffinityHorizontalBars items={bars} unite="sur100" />
      ) : (
        <p className="text-muted-foreground text-sm">
          {analysisPending ? pendingLabel : unavailableLabel}
        </p>
      )}
      {actionableAdvice ? (
        <ProfileActionableAdviceSection advice={actionableAdvice} />
      ) : bars?.length ? (
        <p className="text-muted-foreground border-t border-border pt-4 text-xs leading-relaxed dark:border-zinc-800">
          {legacyAdviceHint}
        </p>
      ) : null}
    </div>
  );
}

/** DISC and SONCAS profiles shown together: both must be visible without tab switching. */
export function InterlocutorProfileTabs({
  discBars,
  soncasBars,
  discPrincipal = null,
  soncasPrincipal = null,
  discActionableAdvice = null,
  soncasActionableAdvice = null,
  analysisPending = false,
}: {
  discBars: ProfileBarItem[] | null;
  soncasBars: ProfileBarItem[] | null;
  discPrincipal?: ProfilePrincipal | null;
  soncasPrincipal?: ProfilePrincipal | null;
  discActionableAdvice?: ProfileActionableAdvice | null;
  soncasActionableAdvice?: ProfileActionableAdvice | null;
  analysisPending?: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfilePanel
        title="Profil DISC"
        principalCaption="Style principal détecté"
        principal={discPrincipal}
        bars={discBars}
        actionableAdvice={discActionableAdvice}
        analysisPending={analysisPending}
        pendingLabel="Analyse DISC en cours…"
        unavailableLabel="Profil DISC indisponible pour ce rendez-vous."
        legacyAdviceHint="Relancez l'analyse pour obtenir des conseils actionnables (ce que cela traduit, comment lui parler, quoi éviter)."
      />
      <ProfilePanel
        title="Profil SONCAS"
        principalCaption="Levier principal détecté"
        principal={soncasPrincipal}
        bars={soncasBars}
        actionableAdvice={soncasActionableAdvice}
        analysisPending={analysisPending}
        pendingLabel="Analyse SONCAS en cours…"
        unavailableLabel="Profil SONCAS indisponible pour ce rendez-vous."
        legacyAdviceHint="Relancez l'analyse pour obtenir des conseils actionnables (ce que cela traduit, comment lui parler, quoi éviter)."
      />
    </div>
  );
}
