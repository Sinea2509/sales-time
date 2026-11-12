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
 * fonctionnalité. Chaque changement est journalisé.
 *
 * Une fonctionnalité réservée à d'autres n'apparaît pas du tout, et la carte
 * disparaît quand il n'en reste aucune : demande de Thomas du 12 novembre
 * 2026, les blocs Pipedrive ne doivent même pas se voir hors de Sinéa. Le
 * serveur refuserait de toute façon de les activer.
 */
export function AdminOrganizationFeaturesCard({
  organizationId,
  enabledFeatures,
}: {
  organizationId: string;
  enabledFeatures: string[];
}) {
  const available = ORGANIZATION_FEATURES.filter((f) =>
    organizationMayHaveFeature(organizationId, f.id),
  );
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

  if (available.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn(cardTitleClass, "flex items-center gap-2")}>
          <Sparkles className="size-4" aria-hidden />
          Fonctionnalités réservées
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {available.map((f) => {
          const on = hasOrganizationFeature(organizationId, [...enabled], f.id);
          return (
            <label
              key={f.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 dark:border-neutral-800"
            >
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[#6C4DFF]"
                checked={on}
                disabled={pending}
                onChange={(e) => toggle(f.id, e.target.checked)}
              />
              <span>
                <span className="block text-sm font-semibold">{f.label}</span>
                <span className="text-muted-foreground block text-xs">
                  {f.description}
                </span>
              </span>
            </label>
          );
        })}
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
