"use client";

import { Infinity as InfinityIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { setOrganizationUnlimitedAction } from "@/app/[locale]/admin/organizations/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

/**
 * Le plan d'une organisation : analyses d'essai, ou illimitées. Le super admin
 * l'accorde ici sans attendre une demande de plan, pour un test par exemple.
 * Chaque changement est journalisé.
 */
export function AdminOrganizationPlanCard({
  organizationId,
  unlimited: initial,
}: {
  organizationId: string;
  unlimited: boolean;
}) {
  const [unlimited, setUnlimited] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await setOrganizationUnlimitedAction({
        organizationId,
        unlimited: next,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setUnlimited(next);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn(cardTitleClass, "flex items-center gap-2")}>
          <InfinityIcon className="size-4" aria-hidden />
          Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 dark:border-neutral-800">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[#6C4DFF]"
            checked={unlimited}
            disabled={pending}
            onChange={(e) => toggle(e.target.checked)}
          />
          <span>
            <span className="block text-sm font-semibold">
              Analyses illimitées
            </span>
            <span className="text-muted-foreground block text-xs">
              Sans limite d&apos;analyses ni encart d&apos;essai. Décoché,
              l&apos;organisation retrouve ses analyses d&apos;essai restantes.
            </span>
          </span>
        </label>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
