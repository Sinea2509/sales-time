"use client";

import { ProfileAffinityHorizontalBars } from "@/components/molecules/profile-affinity-horizontal-bars";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function ProfileTabTrigger({
  title,
  dominant,
}: {
  title: string;
  dominant: ProfileBarItem | null;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-1.5 text-left">
      <span className="text-sm font-medium">{title}</span>
      {dominant ? (
        <DominantProfileTag
          label={dominant.label}
          pillClass={dominant.pillClass}
        />
      ) : null}
    </div>
  );
}

function ProfileTabPanel({
  items,
  analysisPending,
  pendingLabel,
  unavailableLabel,
}: {
  items: ProfileBarItem[] | null;
  analysisPending: boolean;
  pendingLabel: string;
  unavailableLabel: string;
}) {
  if (items?.length) {
    return <ProfileAffinityHorizontalBars items={items} />;
  }

  return (
    <p className="text-muted-foreground text-sm">
      {analysisPending ? pendingLabel : unavailableLabel}
    </p>
  );
}

export function InterlocutorProfileTabs({
  discBars,
  soncasBars,
  analysisPending = false,
}: {
  discBars: ProfileBarItem[] | null;
  soncasBars: ProfileBarItem[] | null;
  analysisPending?: boolean;
}) {
  const defaultTab = discBars?.length
    ? "disc"
    : soncasBars?.length
      ? "soncas"
      : "disc";

  return (
    <Tabs
      defaultValue={defaultTab}
      orientation="vertical"
      className="flex flex-col gap-4 sm:flex-row sm:items-start"
    >
      <TabsList
        variant="line"
        className="h-fit w-full shrink-0 sm:w-52 sm:min-w-52"
      >
        <TabsTrigger value="disc" className="h-auto w-full px-3 py-2.5">
          <ProfileTabTrigger
            title="Profil DISC"
            dominant={discBars?.[0] ?? null}
          />
        </TabsTrigger>
        <TabsTrigger value="soncas" className="h-auto w-full px-3 py-2.5">
          <ProfileTabTrigger
            title="Profil SONCAS"
            dominant={soncasBars?.[0] ?? null}
          />
        </TabsTrigger>
      </TabsList>

      <div className="min-w-0 flex-1">
        <TabsContent value="disc" className="mt-0">
          <ProfileTabPanel
            items={discBars}
            analysisPending={analysisPending}
            pendingLabel="Analyse DISC en cours…"
            unavailableLabel="Profil DISC indisponible pour ce rendez-vous."
          />
        </TabsContent>
        <TabsContent value="soncas" className="mt-0">
          <ProfileTabPanel
            items={soncasBars}
            analysisPending={analysisPending}
            pendingLabel="Analyse SONCAS en cours…"
            unavailableLabel="Profil SONCAS indisponible pour ce rendez-vous."
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
