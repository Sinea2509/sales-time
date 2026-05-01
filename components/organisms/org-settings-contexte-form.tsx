"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrganizationContext } from "@/app/[locale]/company/settings/actions";
import {
  ONBOARDING_DEAL_SIZE_OPTIONS,
  ONBOARDING_INDUSTRY_OPTIONS,
  ONBOARDING_SALES_CYCLE_OPTIONS,
  ONBOARDING_TEAM_SIZE_OPTIONS,
} from "@/lib/onboarding-step1-options";
import { optionsWithLegacy } from "@/lib/options-with-legacy";
import { cn } from "@/lib/utils";
import { orgSettingsSelectClassName } from "@/components/organisms/org-settings-select-class";
import { OrgSettingsLogoForm } from "@/components/organisms/org-settings-logo-form";

export type OrgContexteFormInitial = {
  companyName: string;
  industrySector: string;
  commercialTeamSize: string;
  averageSalesCycle: string;
  averageDealSize: string;
};

export function OrgSettingsContexteForm({
  initial,
  initialLogoUrl,
}: {
  initial: OrgContexteFormInitial;
  initialLogoUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [companyName, setCompanyName] = useState(initial.companyName);
  const [industrySector, setIndustrySector] = useState(initial.industrySector);
  const [commercialTeamSize, setCommercialTeamSize] = useState(
    initial.commercialTeamSize,
  );
  const [averageSalesCycle, setAverageSalesCycle] = useState(
    initial.averageSalesCycle,
  );
  const [averageDealSize, setAverageDealSize] = useState(
    initial.averageDealSize,
  );

  const industryOptions = useMemo(
    () => optionsWithLegacy(ONBOARDING_INDUSTRY_OPTIONS, industrySector),
    [industrySector],
  );
  const teamSizeOptions = useMemo(
    () => optionsWithLegacy(ONBOARDING_TEAM_SIZE_OPTIONS, commercialTeamSize),
    [commercialTeamSize],
  );
  const cycleOptions = useMemo(
    () => optionsWithLegacy(ONBOARDING_SALES_CYCLE_OPTIONS, averageSalesCycle),
    [averageSalesCycle],
  );
  const dealSizeOptions = useMemo(
    () => optionsWithLegacy(ONBOARDING_DEAL_SIZE_OPTIONS, averageDealSize),
    [averageDealSize],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const r = await updateOrganizationContext({
        companyName: companyName.trim() || null,
        industrySector: industrySector || null,
        commercialTeamSize: commercialTeamSize || null,
        averageSalesCycle: averageSalesCycle || null,
        averageDealSize: averageDealSize || null,
      });
      if (!r.ok) {
        setMessage({ type: "err", text: r.message });
        return;
      }
      setMessage({ type: "ok", text: "Enregistré." });
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {message ? (
        <p
          className={cn(
            "text-sm",
            message.type === "ok"
              ? "text-green-700 dark:text-green-400"
              : "text-destructive",
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <OrgSettingsLogoForm initialLogoUrl={initialLogoUrl} />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-company">Nom de l’entreprise</Label>
            <Input
              id="org-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              maxLength={200}
              autoComplete="organization"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-industry">Secteur d’activité</Label>
            <select
              id="org-industry"
              className={orgSettingsSelectClassName}
              value={
                industryOptions.some((o) => o.value === industrySector)
                  ? industrySector
                  : ""
              }
              onChange={(e) => setIndustrySector(e.target.value)}
            >
              <option value="">Sélectionnez un secteur</option>
              {industryOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-team">Taille de l’équipe commerciale</Label>
            <select
              id="org-team"
              className={orgSettingsSelectClassName}
              value={
                teamSizeOptions.some((o) => o.value === commercialTeamSize)
                  ? commercialTeamSize
                  : ""
              }
              onChange={(e) => setCommercialTeamSize(e.target.value)}
            >
              <option value="">Sélectionnez une taille</option>
              {teamSizeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-cycle">Cycle de vente moyen</Label>
            <select
              id="org-cycle"
              className={orgSettingsSelectClassName}
              value={
                cycleOptions.some((o) => o.value === averageSalesCycle)
                  ? averageSalesCycle
                  : ""
              }
              onChange={(e) => setAverageSalesCycle(e.target.value)}
            >
              <option value="">Sélectionnez une durée</option>
              {cycleOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-deal">Ticket moyen</Label>
            <select
              id="org-deal"
              className={orgSettingsSelectClassName}
              value={
                dealSizeOptions.some((o) => o.value === averageDealSize)
                  ? averageDealSize
                  : ""
              }
              onChange={(e) => setAverageDealSize(e.target.value)}
            >
              <option value="">Sélectionnez une fourchette</option>
              {dealSizeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending}
          className="bg-brand text-white hover:bg-brand-hover"
        >
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
