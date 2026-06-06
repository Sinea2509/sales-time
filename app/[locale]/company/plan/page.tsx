import Link from "next/link";
import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  cardTitleClass,
  pageTitleClass,
  sectionHeadingClass,
} from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import { PlanUpgradeRequestForm } from "@/components/organisms/plan-upgrade-request-form";

export const dynamic = "force-dynamic";

const contactHref =
  "mailto:?subject=Sales%20Time%20%E2%80%94%20Forfait%20Entreprise";

type Cell = string | "check";

const comparisonRows: {
  label: string;
  starter: Cell;
  team: Cell;
  entreprise: Cell;
}[] = [
  {
    label: "Analyse de RDV",
    starter: "Illimité",
    team: "Illimité",
    entreprise: "Illimité",
  },
  {
    label: "CR + mail de suivi",
    starter: "check",
    team: "check",
    entreprise: "check",
  },
  { label: "Coaching", starter: "check", team: "check", entreprise: "check" },
  {
    label: "Coaching KISS inclus",
    starter: "check",
    team: "check",
    entreprise: "check",
  },
  { label: "SalesScore", starter: "check", team: "check", entreprise: "check" },
  {
    label: "Préparation du RDV",
    starter: "Incluse",
    team: "Incluse",
    entreprise: "Incluse",
  },
  {
    label: "Vue manager",
    starter: "—",
    team: "Incluse",
    entreprise: "Incluse",
  },
  {
    label: "Dashboard manager",
    starter: "—",
    team: "Incluse",
    entreprise: "Incluse",
  },
  {
    label: "Calibrage coach",
    starter: "—",
    team: "Incluse",
    entreprise: "Complet et personnalisable",
  },
  {
    label: "KISS Management",
    starter: "Basique",
    team: "Incluse",
    entreprise: "Complet et personnalisable",
  },
  {
    label: "Sièges manager",
    starter: "1 siège inclus",
    team: "Sièges manager illimités",
    entreprise: "Sur mesure",
  },
];

function CellValue({ value }: { value: Cell }) {
  if (value === "check") {
    return (
      <span className="inline-flex justify-center">
        <Check
          className="size-4 text-emerald-600 dark:text-emerald-400"
          aria-label="Inclus"
        />
      </span>
    );
  }
  if (value === "—") {
    return <span className="text-muted-foreground">—</span>;
  }
  return <span className="text-sm">{value}</span>;
}

export default function CompanyPlanPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
      <div className="space-y-2">
        <h1 className={pageTitleClass}>
          Choisissez le forfait qui vous convient
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Trois offres pour les commerciaux solo, les équipes managées et les
          grands comptes. Toutes incluent l’analyse de rendez-vous et le
          coaching KISS.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className={cardTitleClass}>Starter</CardTitle>
            <CardDescription>Commercial solo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-semibold tabular-nums">49&nbsp;€</p>
              <p className="text-muted-foreground text-sm">
                par utilisateur / mois
              </p>
            </div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Max. 5 utilisateurs
            </p>
            <Link
              href={contactHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 w-full",
              )}
            >
              Choisir ce plan
            </Link>
          </CardContent>
        </Card>

        <Card className="border-brand/40 shadow-md ring-1 ring-brand/20 dark:border-brand/50">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">Team</CardTitle>
              <span className="rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-semibold text-brand">
                Populaire
              </span>
            </div>
            <CardDescription>Équipe managée</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-semibold tabular-nums">79&nbsp;€</p>
              <p className="text-muted-foreground text-sm">
                par utilisateur / mois
              </p>
            </div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Max. 50 utilisateurs
            </p>
            <Link
              href={contactHref}
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-9 w-full bg-brand text-white hover:bg-brand-hover",
              )}
            >
              Choisir ce plan
            </Link>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className={cardTitleClass}>Entreprise</CardTitle>
            <CardDescription>Grands comptes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-semibold tabular-nums">Sur devis</p>
              <p className="text-muted-foreground text-sm">
                Facturation sur mesure
              </p>
            </div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Plus de 50 utilisateurs
            </p>
            <Link
              href={contactHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 w-full",
              )}
            >
              Nous contacter
            </Link>
          </CardContent>
        </Card>
      </div>

      <PlanUpgradeRequestForm />

      <div className="space-y-3">
        <h2 className={sectionHeadingClass}>Comparatif détaillé</h2>
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/50">
                <th className="px-4 py-3 font-medium text-neutral-500 dark:text-neutral-400">
                  Fonctionnalité
                </th>
                <th className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                  Starter
                </th>
                <th className="px-4 py-3 font-semibold text-brand">Team</th>
                <th className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                  Entreprise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {comparisonRows.map((row) => (
                <tr
                  key={row.label}
                  className="bg-white hover:bg-neutral-50/80 dark:bg-neutral-950 dark:hover:bg-neutral-900/40"
                >
                  <th
                    scope="row"
                    className="px-4 py-3 font-normal text-neutral-700 dark:text-neutral-300"
                  >
                    {row.label}
                  </th>
                  <td className="px-4 py-3 text-center sm:text-left">
                    <CellValue value={row.starter} />
                  </td>
                  <td className="bg-brand/[0.04] px-4 py-3 text-center sm:text-left">
                    <CellValue value={row.team} />
                  </td>
                  <td className="px-4 py-3 text-center sm:text-left">
                    <CellValue value={row.entreprise} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
