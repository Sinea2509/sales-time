"use client";

import { Presentation } from "lucide-react";
import { useState, useTransition } from "react";
import {
  ensureDemoOrganizationAction,
  type EnsureDemoOrganizationActionResult,
} from "@/app/[locale]/admin/organizations/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

/**
 * L'organisation de démonstration, à portée de clic avant un rendez-vous
 * commercial. Les identifiants affichés sont ceux de comptes fictifs, en
 * `.local`, qui n'existent que pour cette démo.
 */
export function AdminDemoOrganizationCard({
  existing,
}: {
  /** État actuel, lu par la page : absent tant que la démo n'a pas été créée. */
  existing: { memberCount: number; meetingCount: number } | null;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] =
    useState<EnsureDemoOrganizationActionResult | null>(null);

  const demo = result?.ok ? result.demo : null;
  const filled = demo
    ? { memberCount: demo.memberCount, meetingCount: demo.meetingCount }
    : existing;

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn(cardTitleClass, "flex items-center gap-2")}>
          <Presentation className="size-4" />
          Organisation de démonstration
        </CardTitle>
        <CardDescription>
          « Acme Solutions » : un manager, trois commerciaux, dix contacts et
          des rendez-vous déjà analysés, pour montrer le produit sans données
          client. Une démo déjà remplie n&apos;est pas modifiée.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setResult(await ensureDemoOrganizationAction());
              })
            }
          >
            {pending
              ? "Préparation…"
              : filled
                ? "Vérifier la démo"
                : "Créer la démo"}
          </Button>
          {filled ? (
            <p className="text-muted-foreground text-sm">
              {filled.memberCount} membres · {filled.meetingCount} rendez-vous
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Pas encore créée sur cette plateforme.
            </p>
          )}
        </div>

        {result && !result.ok ? (
          <p className="text-destructive text-sm" role="alert">
            {result.message}
          </p>
        ) : null}

        {demo ? (
          <dl className="grid gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs font-medium">
                Compte manager
              </dt>
              <dd className="mt-0.5 font-mono">{demo.managerEmail}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs font-medium">
                Mot de passe (tous les comptes de démo)
              </dt>
              <dd className="mt-0.5 font-mono">{demo.password}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground text-xs font-medium">
                Comptes commerciaux
              </dt>
              <dd className="mt-0.5 font-mono">
                {demo.salesEmails.join(" · ")}
              </dd>
            </div>
          </dl>
        ) : null}
      </CardContent>
    </Card>
  );
}
