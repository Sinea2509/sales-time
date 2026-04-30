import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function CompanyPlanPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Choisissez le forfait qui vous convient le mieux
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-base">Starter</CardTitle>
            <CardDescription>Pour debuter simplement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">49 EUR/mois/utilisateur</p>
            <p className="text-muted-foreground text-sm">
              Fonctionnalites essentielles pour les independants et petites
              equipes.
            </p>
          </CardContent>
        </Card>

        <Card className="border-brand/30 shadow-sm dark:border-brand/40">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Team</CardTitle>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                Populaire
              </span>
            </div>
            <CardDescription>Le meilleur choix pour scaler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">79 EUR/mois/utilisateur</p>
            <p className="text-muted-foreground text-sm">
              Collaboration equipe, analyses avancees et accompagnement
              prioritaire.
            </p>
            <Link
              href="#"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-brand text-white hover:bg-brand-hover",
              )}
            >
              Choisir Team
            </Link>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardHeader>
            <CardTitle className="text-base">Entreprise</CardTitle>
            <CardDescription>Equipes et accompagnement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-semibold">Sur devis</p>
            <p className="text-muted-foreground text-sm">
              Onboarding dedie et suivi personnalise.
            </p>
            <Link
              href="#"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Contacter Cedric
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
