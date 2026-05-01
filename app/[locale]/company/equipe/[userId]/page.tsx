import { notFound, redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDurationHoursMinutes } from "@/lib/format-duration-fr";
import { prospectInitials } from "@/lib/prospect-initials";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { getApplicationDeps } from "@/lib/application-deps";
import {
  meetingAtSinceForStatsWindow,
  parseStatsWindowDays,
} from "@/src/core/domain/dashboard-stats-window";
import { getOrgDashboardHome } from "@/src/core/application/get-org-dashboard-home";
import {
  buildKissTeamRollupFromMeetings,
  ORG_ADMIN_DASHBOARD_MEETING_CAP,
} from "@/src/core/application/get-org-admin-dashboard";
import { OrgAdminKissQuadrantGrid } from "@/components/organisms/org-admin-kiss-quadrant-grid";
import { kissMarkdownAppendixForAudience } from "@/lib/kiss-org-appendix-for-analysis";
import { soncasResultSchema } from "@/src/core/domain/analysis-result-zod";
import {
  aggregateDiscAffinityBarsFromMeetings,
  aggregateSoncasAffinityBarsFromMeetings,
  DISC_BAR_CLASS,
  emptyDiscAffinityPlaceholder,
  emptySoncasAffinityPlaceholder,
  SONCAS_BAR_CLASS,
} from "@/src/core/domain/seller-affinity-from-meetings";
import { ProfileAffinityHorizontalBars } from "@/components/molecules/profile-affinity-horizontal-bars";
import type { RecentMeetingListRow } from "@/src/core/ports/meeting-repository-port";
import type {
  SellerCommercialMeetingDigestForSummary,
  SellerCommercialPerformanceSummary,
  SellerRelationalAffinitySummary,
} from "@/src/core/ports/analysis-port";
import { ANALYSIS_GATEWAY_MODEL } from "@/lib/analysis-model";
import { getEnv } from "@/lib/env";
import {
  cardProseBodyClass,
  cardSubsectionTitleClass,
  cardTitleClass,
  pageTitleClass,
  sectionHeadingClass,
} from "@/lib/page-typography";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DRIVER_LABEL_FR: Record<
  "securite" | "orgueil" | "nouveaute" | "confort" | "argent" | "sympathie",
  string
> = {
  securite: "Sécurité",
  orgueil: "Orgueil",
  nouveaute: "Nouveauté",
  confort: "Confort",
  argent: "Argent",
  sympathie: "Sympathie",
};

function modeSoncasDominantLabel(dominants: string[]): string | null {
  if (dominants.length === 0) return null;
  const counts = new Map<string, number>();
  for (const d of dominants) {
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  let bestKey = dominants[0]!;
  let bestCount = -1;
  for (const [k, n] of counts) {
    if (
      n > bestCount ||
      (n === bestCount && k.localeCompare(bestKey, "fr") < 0)
    ) {
      bestCount = n;
      bestKey = k;
    }
  }
  return DRIVER_LABEL_FR[bestKey as keyof typeof DRIVER_LABEL_FR] ?? bestKey;
}

function postureLabelFromMeetings(
  meetings: RecentMeetingListRow[],
): string | null {
  const dominants: string[] = [];
  for (const m of meetings) {
    if (m.latestSoncasResult == null) continue;
    const parsed = soncasResultSchema.safeParse(m.latestSoncasResult);
    if (parsed.success) dominants.push(parsed.data.dominant);
  }
  return modeSoncasDominantLabel(dominants);
}

function countMeetingTypes(meetings: RecentMeetingListRow[]): {
  decouverte: number;
  proposition: number;
} {
  let decouverte = 0;
  let proposition = 0;
  for (const m of meetings) {
    const t = (m.meetingType ?? "").trim().toLowerCase();
    if (t === "découverte" || t === "decouverte") decouverte += 1;
    else if (t === "proposition" || t.includes("proposition")) proposition += 1;
  }
  return { decouverte, proposition };
}

const MAX_MEETINGS_FOR_AI = 16;
const MAX_TRANSCRIPT_CHARS = 2400;

function buildSellerMeetingDigests(
  meetings: RecentMeetingListRow[],
): SellerCommercialMeetingDigestForSummary[] {
  const sorted = [...meetings].sort(
    (a, b) => b.meetingAt.getTime() - a.meetingAt.getTime(),
  );
  return sorted.slice(0, MAX_MEETINGS_FOR_AI).map((m) => ({
    prospectName: m.prospectName,
    meetingAt: m.meetingAt.toISOString(),
    meetingType: m.meetingType,
    transcriptExcerpt:
      m.transcript.length > MAX_TRANSCRIPT_CHARS
        ? `${m.transcript.slice(0, MAX_TRANSCRIPT_CHARS)}\n\n[…]`
        : m.transcript,
    soncasResult: m.latestSoncasResult ?? undefined,
    discResult: m.latestDiscResult ?? undefined,
    kissResult: m.latestKissResult ?? undefined,
  }));
}

function statColumn({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-[4.5rem] flex-col items-start gap-1 sm:min-w-[5.5rem]">
      <span className="text-foreground text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </span>
      <span className="text-muted-foreground max-w-[7rem] text-left text-[11px] font-medium leading-tight">
        {label}
      </span>
    </div>
  );
}

type Props = {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<{ jours?: string }>;
};

export default async function ManagerCommercialViewPage({
  params,
  searchParams,
}: Props) {
  const { userId } = await params;
  const sp = searchParams != null ? await searchParams : {};
  const joursParam = Array.isArray(sp.jours) ? sp.jours[0] : sp.jours;
  if (joursParam === "30") {
    redirect(`/company/equipe/${userId}`);
  }
  const statsWindowDays = parseStatsWindowDays(sp.jours);

  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }
  if (actor.workspaceRoleMode !== "admin") {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const orgId = actor.activeOrganizationId;

  const [member, home, globalKissJson] = await Promise.all([
    deps.organizationTeam.findMembershipForManagerView(orgId, userId),
    getOrgDashboardHome(
      {
        meetings: deps.meetings,
        organizationSettings: deps.organizationSettings,
      },
      {
        organizationId: orgId,
        statsWindowDays,
        sellerUserId: userId,
      },
    ),
    deps.globalKissCoachingPrompts.getPrompts(),
  ]);

  if (!member) notFound();
  if (!home) redirect("/company");

  const since = meetingAtSinceForStatsWindow(statsWindowDays);
  const meetings = await deps.meetings.listRecentMeetingsForDashboard({
    organizationId: orgId,
    limit: ORG_ADMIN_DASHBOARD_MEETING_CAP,
    meetingAtSince: since,
    sellerUserId: userId,
    includeLatestSoncasResult: true,
    includeLatestDiscResult: true,
    includeLatestKissResult: true,
  });

  const { decouverte, proposition } = countMeetingTypes(meetings);
  const posture = postureLabelFromMeetings(meetings);
  const nameLine =
    [member.user.firstName?.trim() ?? "", member.user.lastName?.trim() ?? ""]
      .filter(Boolean)
      .join(" ")
      .trim() || member.user.email;
  const initials = prospectInitials(nameLine);

  const meetingDigests = buildSellerMeetingDigests(meetings);
  let performanceSummary: SellerCommercialPerformanceSummary | null = null;
  let relationalAffinity: SellerRelationalAffinitySummary | null = null;
  if (getEnv().AI_GATEWAY_API_KEY && meetingDigests.length > 0) {
    const aiPayload = {
      sellerDisplayName: nameLine,
      meetings: meetingDigests,
      model: ANALYSIS_GATEWAY_MODEL,
    };
    const [perfRes, affinityRes] = await Promise.allSettled([
      deps.analysis.summarizeSellerCommercialPerformance(aiPayload),
      deps.analysis.summarizeSellerRelationalAffinity(aiPayload),
    ]);
    if (perfRes.status === "fulfilled") performanceSummary = perfRes.value;
    if (affinityRes.status === "fulfilled")
      relationalAffinity = affinityRes.value;
  }

  const kissSellerRollup = buildKissTeamRollupFromMeetings(meetings);
  let kissSellerStrengthsNarrative: string | null = null;
  if (getEnv().AI_GATEWAY_API_KEY) {
    try {
      kissSellerStrengthsNarrative = await deps.analysis.summarizeOrgKissRollup(
        {
          rollup: kissSellerRollup,
          model: ANALYSIS_GATEWAY_MODEL,
          organizationKissPromptAppendix: kissMarkdownAppendixForAudience(
            globalKissJson,
            "manager",
          ),
        },
      );
    } catch {
      kissSellerStrengthsNarrative = null;
    }
  }

  const performanceFallback =
    performanceSummary != null
      ? null
      : meetingDigests.length === 0
        ? "Pas assez de données pour une analyse"
        : getEnv().AI_GATEWAY_API_KEY
          ? "La synthèse automatique n’a pas pu être produite. Réessayez plus tard."
          : "Pour générer ce texte à partir des transcriptions et des analyses (SONCAS, DISC, KISS), configurez AI_GATEWAY_API_KEY.";

  const performanceParagraph = (text: string | undefined): string | null => {
    const t = text?.trim();
    if (t) return t;
    if (performanceSummary == null) return performanceFallback;
    return "Ce bloc n’a pas été renseigné par la synthèse.";
  };

  const discAffinityBars = aggregateDiscAffinityBarsFromMeetings(meetings);
  const soncasAffinityBars = aggregateSoncasAffinityBarsFromMeetings(meetings);
  const discBarSource =
    discAffinityBars.length > 0
      ? discAffinityBars
      : emptyDiscAffinityPlaceholder();
  const soncasBarSource =
    soncasAffinityBars.length > 0
      ? soncasAffinityBars
      : emptySoncasAffinityPlaceholder();
  const discBarItems = discBarSource.map((d) => ({
    key: d.key,
    label: d.label,
    pct: d.pct,
    barClass: DISC_BAR_CLASS[d.key],
  }));
  const soncasBarItems = soncasBarSource.map((d) => ({
    key: d.key,
    label: d.label,
    pct: d.pct,
    barClass: SONCAS_BAR_CLASS[d.key],
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl font-semibold text-zinc-800 shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700/80">
            {initials}
          </span>
          <div className="flex max-w-md flex-col items-center gap-1 text-center sm:items-start sm:text-left">
            <p className={pageTitleClass}>{nameLine}</p>
            {posture ? (
              <Badge
                variant="secondary"
                className="mt-0.5 px-2.5 py-0.5 text-xs font-medium"
              >
                Posture · {posture}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="mt-0.5 px-2.5 py-0.5 text-xs font-normal text-muted-foreground"
              >
                Posture · —
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-start justify-center gap-8 self-start border-t border-zinc-200 pt-6 sm:justify-end sm:border-t-0 sm:pt-0 lg:min-w-0 dark:border-zinc-800">
          {statColumn({
            value: String(home.nbRdvs),
            label: "RDVs",
          })}
          {statColumn({
            value: String(decouverte),
            label: "RDVs Découverte",
          })}
          {statColumn({
            value: String(proposition),
            label: "RDVs Proposition",
          })}
          {statColumn({
            value: formatDurationHoursMinutes(home.tamCumuleMinutes),
            label: "TAM",
          })}
        </div>
      </div>

      <Card
        size="sm"
        className="overflow-hidden border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <CardHeader className="pb-3">
          <CardTitle
            className={cn(cardTitleClass, "flex flex-row items-center gap-2")}
          >
            Profil de performance
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-100/90 ring-1 ring-violet-300/50 dark:bg-violet-950/60 dark:ring-violet-700/40"
              aria-hidden
            >
              <Sparkles
                className="size-3 text-violet-600 drop-shadow-[0_0_6px_rgba(139,92,246,0.4)] dark:text-violet-300 dark:drop-shadow-[0_0_8px_rgba(167,139,250,0.3)]"
                strokeWidth={2}
              />
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="space-y-8">
            <section>
              <h3 className={cardSubsectionTitleClass}>Forces</h3>
              <p
                className={cn(
                  cardProseBodyClass,
                  "mt-2 whitespace-pre-wrap dark:text-zinc-200/90",
                )}
              >
                {performanceParagraph(performanceSummary?.forces)}
              </p>
            </section>
            <section>
              <h3 className={cardSubsectionTitleClass}>
                Axes d&apos;amélioration
              </h3>
              <p
                className={cn(
                  cardProseBodyClass,
                  "mt-2 whitespace-pre-wrap dark:text-zinc-200/90",
                )}
              >
                {performanceParagraph(performanceSummary?.axesAmelioration)}
              </p>
            </section>
            <section>
              <h3 className={cardSubsectionTitleClass}>À stopper</h3>
              <p
                className={cn(
                  cardProseBodyClass,
                  "mt-2 whitespace-pre-wrap dark:text-zinc-200/90",
                )}
              >
                {performanceParagraph(performanceSummary?.aStopper)}
              </p>
            </section>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          size="sm"
          className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <CardHeader className="pb-3">
            <CardTitle className={cardTitleClass}>
              Affinité relationnelle par profil DISC
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ProfileAffinityHorizontalBars items={discBarItems} />
            {relationalAffinity?.discAffinity?.trim() ? (
              <p className="text-muted-foreground mt-5 border-t border-zinc-100 pt-5 text-sm leading-relaxed whitespace-pre-wrap dark:border-zinc-800">
                {relationalAffinity.discAffinity.trim()}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card
          size="sm"
          className="border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <CardHeader className="pb-3">
            <CardTitle className={cardTitleClass}>
              Affinité relationnelle par profil SONCAS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ProfileAffinityHorizontalBars items={soncasBarItems} />
            {relationalAffinity?.soncasAffinity?.trim() ? (
              <p className="text-muted-foreground mt-5 border-t border-zinc-100 pt-5 text-sm leading-relaxed whitespace-pre-wrap dark:border-zinc-800">
                {relationalAffinity.soncasAffinity.trim()}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className={sectionHeadingClass}>Coaching KISS</h2>
        {kissSellerStrengthsNarrative?.trim() ? (
          <p className={cn(cardProseBodyClass, "max-w-3xl")}>
            {kissSellerStrengthsNarrative.trim()}
          </p>
        ) : null}
        <OrgAdminKissQuadrantGrid
          rollup={kissSellerRollup}
          presentation="managerMemberProfile"
        />
      </section>
    </div>
  );
}
