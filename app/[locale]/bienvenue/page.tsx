import { redirect } from "next/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { MemberWelcomeGuide } from "@/components/organisms/member-welcome-guide";
import { DEFAULT_SCORECARD_GRID } from "@/src/core/domain/scorecard-grid";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ etape?: string }>;
};

/** Le guide de démarrage, affiché à l'invité juste après son inscription. */
export default async function WelcomeGuidePage({ searchParams }: Props) {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated") redirect("/sign-in");

  const sp = searchParams != null ? await searchParams : {};
  const step = Number.parseInt(sp.etape ?? "1", 10);
  const deps = getApplicationDeps();
  const organizationName = actor.activeOrganizationId
    ? ((await deps.organizationTeam
        .getOrganizationName(actor.activeOrganizationId)
        .catch(() => null)) ?? "votre équipe")
    : "votre équipe";

  return (
    <MemberWelcomeGuide
      step={Number.isFinite(step) ? step : 1}
      firstName={actor.firstName?.trim() || null}
      organizationName={organizationName}
      gridBlocks={DEFAULT_SCORECARD_GRID.blocks.map((b) => ({
        key: b.key,
        name: b.name,
        weight: b.weight,
      }))}
      newMeetingHref="/company/rendez-vous/nouveau"
      dashboardHref="/company"
    />
  );
}
