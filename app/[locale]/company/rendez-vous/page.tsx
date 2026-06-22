import { RendezVousMeetingsShell } from "@/components/organisms/rendez-vous-meetings-shell";
import { PageHeaderSimple } from "@/components/molecules/page-header";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { tamMinutesSavedPerMeetingFromSettings } from "@/src/core/domain/dashboard-estimates";
import { resolveProspectListDisplay } from "@/src/core/domain/prospect-list-identity";

export const dynamic = "force-dynamic";

export default async function RendezVousPage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const isAdmin = actor.workspaceRoleMode === "admin";
  const sellerScope =
    actor.workspaceRoleMode === "member"
      ? (actor.internalUserId ?? undefined)
      : undefined;

  if (actor.workspaceRoleMode === "member" && !actor.internalUserId) {
    redirect("/company");
  }

  const [meetings, settings, companyAliases] = await Promise.all([
    deps.meetings.listRecentMeetingsForDashboard({
      organizationId: actor.activeOrganizationId,
      limit: 200,
      sellerUserId: sellerScope,
    }),
    deps.organizationSettings.findByOrganizationId(actor.activeOrganizationId),
    deps.contacts.findProspectCompanyAliasByPersonId({
      organizationId: actor.activeOrganizationId,
    }),
  ]);

  const tamMinutesPerRdv = tamMinutesSavedPerMeetingFromSettings(settings);

  const rows = meetings.map((m) => {
    const identity = resolveProspectListDisplay({
      personDisplayName: m.personDisplayName,
      personCompany: m.prospectCompany,
      companyAlias: companyAliases.get(m.personId) ?? null,
    });
    return {
      id: m.id,
      prospectName: identity.displayName,
      prospectCompany: identity.company,
      meetingAt: m.meetingAt.toISOString(),
      meetingType: m.meetingType,
      pipelineStage: m.pipelineStage,
      salesScore: m.salesScore,
      potentialAmount: m.potentialAmount,
    };
  });

  return (
    <div className="space-y-8">
      <PageHeaderSimple title={isAdmin ? "Rendez-vous" : "Mes rendez-vous"} />

      <RendezVousMeetingsShell
        meetings={rows}
        tamMinutesPerRdv={tamMinutesPerRdv}
      />
    </div>
  );
}
