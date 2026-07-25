import { ContentCard } from "@/components/molecules/content-card";
import { NavLinkButton } from "@/components/molecules/nav-link-button";
import { MeetingCreateForm } from "@/components/organisms/meeting-create-form";
import { pageTitleClass } from "@/lib/page-typography";

type MeetingCreatePageShellProps = {
  meetingTypeOptions: string[];
  pipelineStageOptions: string[];
};

export function MeetingCreatePageShell({
  meetingTypeOptions,
  pipelineStageOptions,
}: MeetingCreatePageShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className={pageTitleClass}>Nouveau rendez-vous</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Transcript manuel, idéal pour alimenter l’IA.
          </p>
        </div>
        <NavLinkButton href="/company/rendez-vous" variant="ghost" size="sm">
          Retour
        </NavLinkButton>
      </div>

      <ContentCard
        className="border-neutral-200 shadow-sm dark:border-neutral-800"
        title="Détails du rendez-vous"
        description="Renseignez les informations puis enregistrez pour lancer l’analyse SONCAS / DISC."
      >
        <MeetingCreateForm
          meetingTypeOptions={meetingTypeOptions}
          pipelineStageOptions={pipelineStageOptions}
        />
      </ContentCard>
    </div>
  );
}
