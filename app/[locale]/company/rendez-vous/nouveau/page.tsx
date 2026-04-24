import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { MeetingCreateForm } from "@/components/organisms/meeting-create-form";
import { stringArrayFromOrgJson } from "@/lib/org-settings-json";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NouveauRendezVousPage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const deps = makeApplicationDeps();
  const settings = await deps.organizationSettings.findByOrganizationId(
    actor.activeOrganizationId,
  );
  const meetingTypeOptions = stringArrayFromOrgJson(settings?.meetingTypes, [
    "Découverte",
    "Démo",
    "Proposition",
    "Négociation",
  ]);
  const pipelineStageOptions = stringArrayFromOrgJson(settings?.pipelineStages, [
    "Lead",
    "Qualifié",
    "Proposition",
    "Gagné",
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-neutral-950 text-2xl font-semibold tracking-tight dark:text-neutral-50">
            Nouveau rendez-vous
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Transcript manuel — idéal pour alimenter l’IA.
          </p>
        </div>
        <Link
          href="/company/rendez-vous"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Retour
        </Link>
      </div>

      <Card className="border-neutral-200 shadow-sm dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="text-base">Détails du rendez-vous</CardTitle>
          <CardDescription>
            Renseignez les informations puis enregistrez pour lancer l’analyse
            SONCAS / DISC.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeetingCreateForm
            meetingTypeOptions={meetingTypeOptions}
            pipelineStageOptions={pipelineStageOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
