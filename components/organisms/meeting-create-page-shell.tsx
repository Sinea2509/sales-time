import { ContentCard } from "@/components/molecules/content-card";
import { NavLinkButton } from "@/components/molecules/nav-link-button";
import { MeetingDepositFlow } from "@/components/organisms/meeting-deposit-flow";
import { pageTitleClass } from "@/lib/page-typography";

type MeetingCreatePageShellProps = {
  meetingTypeOptions: string[];
};

export function MeetingCreatePageShell({
  meetingTypeOptions,
}: MeetingCreatePageShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className={pageTitleClass}>Analyser un rendez-vous</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Déposez l’enregistrement ou le transcript : Sales Time remplit la
            fiche, vous vérifiez, l’analyse démarre.
          </p>
        </div>
        <NavLinkButton href="/company/rendez-vous" variant="ghost" size="sm">
          Retour
        </NavLinkButton>
      </div>

      <ContentCard
        className="border-border shadow-sm dark:border-neutral-800"
        title="Votre rendez-vous"
      >
        <MeetingDepositFlow meetingTypeOptions={meetingTypeOptions} />
      </ContentCard>
    </div>
  );
}
