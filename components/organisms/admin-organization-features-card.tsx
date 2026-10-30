"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { setOrganizationFeatureAction } from "@/app/[locale]/admin/organizations/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import {
  ORGANIZATION_FEATURES,
  hasOrganizationFeature,
  organizationMayHaveFeature,
} from "@/src/core/domain/organization-features";

/**
 * Les fonctionnalités réservées d'une organisation, une case par
 * fonctionnalité. Chaque changement est journalisé. Une organisation qui n'y a
 * pas droit voit la case grisée, et le serveur refuserait de toute façon.
 */
export function AdminOrganizationFeaturesCard({
  organizationId,
  enabledFeatures,
}: {
  organizationId: string;
  enabledFeatures: string[];
}) {
  const [enabled, setEnabled] = useState(() => new Set(enabledFeatures));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(feature: string, next: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await setOrganizationFeatureAction({
        organizationId,
        feature,
        enabled: next,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setEnabled((prev) => {
        const copy = new Set(prev);
        if (next) copy.add(feature);
        else copy.delete(feature);
        return copy;
      });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn(cardTitleClass, "flex items-center gap-2")}>
          <Sparkles className="size-4" aria-hidden />
          Fonctionnalités réservées
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ORGANIZATION_FEATURES.map((f) => {
          const allowed = organizationMayHaveFeature(organizationId, f.id);
          const on = hasOrganizationFeature(organizationId, [...enabled], f.id);
          return (
            <label
              key={f.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border border-border p-3 dark:border-neutral-800",
                allowed ? "cursor-pointer" : "cursor-not-allowed opacity-60",
              )}
            >
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[#6C4DFF]"
                checked={on}
                disabled={pending || !allowed}
                onChange={(e) => toggle(f.id, e.target.checked)}
              />
              <span>
                <span className="block text-sm font-semibold">{f.label}</span>
                <span className="text-muted-foreground block text-xs">
                  {f.description}
                </span>
                {allowed ? null : (
                  <span className="text-muted-foreground mt-1 block text-xs font-semibold">
                    {f.reservedNotice}
                  </span>
                )}
              </span>
            </label>
          );
        })}
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
