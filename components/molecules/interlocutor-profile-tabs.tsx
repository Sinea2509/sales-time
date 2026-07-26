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

function ProfilePanel({
  title,
  bars,
  actionableAdvice,
  analysisPending,
  pendingLabel,
  unavailableLabel,
  legacyAdviceHint,
}: {
  title: string;
  bars: ProfileBarItem[] | null;
  actionableAdvice?: ProfileActionableAdvice | null;
  analysisPending: boolean;
  pendingLabel: string;
  unavailableLabel: string;
  legacyAdviceHint: string;
}) {
  const dominant = bars?.[0] ?? null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className={cardSubsectionTitleClass}>{title}</h3>
        {dominant ? (
          <DominantProfileTag
            label={dominant.label}
            pillClass={dominant.pillClass}
          />
        ) : null}
      </div>
      {bars?.length ? (
        <ProfileAffinityHorizontalBars items={bars} />
      ) : (
        <p className="text-muted-foreground text-sm">
          {analysisPending ? pendingLabel : unavailableLabel}
        </p>
      )}
      {actionableAdvice ? (
        <ProfileActionableAdviceSection advice={actionableAdvice} />
      ) : bars?.length ? (
        <p className="text-muted-foreground border-t border-zinc-100 pt-4 text-xs leading-relaxed dark:border-zinc-800">
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
  discActionableAdvice = null,
  soncasActionableAdvice = null,
  analysisPending = false,
}: {
  discBars: ProfileBarItem[] | null;
  soncasBars: ProfileBarItem[] | null;
  discActionableAdvice?: ProfileActionableAdvice | null;
  soncasActionableAdvice?: ProfileActionableAdvice | null;
  analysisPending?: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfilePanel
        title="Profil DISC"
        bars={discBars}
        actionableAdvice={discActionableAdvice}
        analysisPending={analysisPending}
        pendingLabel="Analyse DISC en cours…"
        unavailableLabel="Profil DISC indisponible pour ce rendez-vous."
        legacyAdviceHint="Relancez l'analyse pour obtenir des conseils actionnables (ce que ça veut dire, comment lui parler, quoi éviter)."
      />
      <ProfilePanel
        title="Profil SONCAS"
        bars={soncasBars}
        actionableAdvice={soncasActionableAdvice}
        analysisPending={analysisPending}
        pendingLabel="Analyse SONCAS en cours…"
        unavailableLabel="Profil SONCAS indisponible pour ce rendez-vous."
        legacyAdviceHint="Relancez l'analyse pour obtenir des conseils actionnables (ce que ça veut dire, comment lui parler, quoi éviter)."
      />
    </div>
  );
}
