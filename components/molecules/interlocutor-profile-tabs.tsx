import { ProfileAffinityHorizontalBars } from "@/components/molecules/profile-affinity-horizontal-bars";
import { cardSubsectionTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

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
  analysisPending,
  pendingLabel,
  unavailableLabel,
}: {
  title: string;
  bars: ProfileBarItem[] | null;
  analysisPending: boolean;
  pendingLabel: string;
  unavailableLabel: string;
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
    </div>
  );
}

/** DISC and SONCAS profiles shown together — both must be visible without tab switching. */
export function InterlocutorProfileTabs({
  discBars,
  soncasBars,
  analysisPending = false,
}: {
  discBars: ProfileBarItem[] | null;
  soncasBars: ProfileBarItem[] | null;
  analysisPending?: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProfilePanel
        title="Profil DISC"
        bars={discBars}
        analysisPending={analysisPending}
        pendingLabel="Analyse DISC en cours…"
        unavailableLabel="Profil DISC indisponible pour ce rendez-vous."
      />
      <ProfilePanel
        title="Profil SONCAS"
        bars={soncasBars}
        analysisPending={analysisPending}
        pendingLabel="Analyse SONCAS en cours…"
        unavailableLabel="Profil SONCAS indisponible pour ce rendez-vous."
      />
    </div>
  );
}
