import {
  discResultSchema,
  soncasResultSchema,
} from "@/src/core/domain/analysis-result-zod";
import { kissMarkdownAppendixForAudience } from "@/lib/kiss-org-appendix-for-analysis";
import { organizationPlaybookMarkdownForAnalysis } from "@/lib/organization-playbook-for-analysis";
import { sendTransactionalEmail } from "@/lib/email/mailer";
import type { AnalysisPort } from "@/src/core/ports/analysis-port";
import type { AiRequestLogRepositoryPort } from "@/src/core/ports/ai-request-log-repository-port";
import type { GlobalKissCoachingPromptsRepositoryPort } from "@/src/core/ports/global-kiss-coaching-prompts-repository-port";
import type {
  MeetingAnalysisKind,
  MeetingRepositoryPort,
} from "@/src/core/ports/meeting-repository-port";
import type { NotificationRepositoryPort } from "@/src/core/ports/notification-repository-port";
import type { OrganizationSettingsRepositoryPort } from "@/src/core/ports/organization-settings-repository-port";
import type { PromptTemplateRepositoryPort } from "@/src/core/ports/prompt-template-repository-port";
import type { UserRepositoryPort } from "@/src/core/ports/user-repository-port";
import { runMeetingAnalysis } from "./run-meeting-analysis";

export type RunAllMeetingAnalysesResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      message?: string;
      failedKind?: MeetingAnalysisKind;
    };

export async function runAllMeetingAnalysesForOrg(
  deps: {
    meetings: MeetingRepositoryPort;
    prompts: PromptTemplateRepositoryPort;
    analysis: AnalysisPort;
    aiLogs?: AiRequestLogRepositoryPort;
    globalKissCoachingPrompts?: GlobalKissCoachingPromptsRepositoryPort;
    /** Absent : les analyses tournent sans le playbook de l'organisation. */
    organizationSettings?: OrganizationSettingsRepositoryPort;
    notifications?: NotificationRepositoryPort;
    users?: UserRepositoryPort;
  },
  input: {
    organizationId: string;
    meetingId: string;
    jobId?: string | null;
    notifyOnComplete?: boolean;
  },
): Promise<RunAllMeetingAnalysesResult> {
  const meeting = await deps.meetings.findMeetingByIdForOrg({
    id: input.meetingId,
    organizationId: input.organizationId,
  });
  if (!meeting) {
    return { ok: false, error: "MEETING_NOT_FOUND" };
  }

  await deps.meetings.updateMeetingStatus({
    id: meeting.id,
    organizationId: input.organizationId,
    status: "PROCESSING",
    errorMessage: null,
  });
  await deps.meetings.updateMeetingVisitReportDraft({
    id: meeting.id,
    organizationId: input.organizationId,
    visitReportDraft: null,
  });

  const globalKissJson = deps.globalKissCoachingPrompts
    ? await deps.globalKissCoachingPrompts.getPrompts()
    : null;
  const kissAppendix = kissMarkdownAppendixForAudience(
    globalKissJson,
    "commercial",
  );

  /*
    Le playbook est lu une fois pour toute la séquence. Le lire à chaque analyse
    exposerait celle-ci à une modification faite en cours de route : SONCAS
    verrait un playbook, KISS un autre, et la fiche RDV mélangerait deux
    versions du contexte sans que personne puisse le voir.
  */
  const settingsRow = deps.organizationSettings
    ? await deps.organizationSettings.findByOrganizationId(input.organizationId)
    : null;
  const playbookMarkdown = organizationPlaybookMarkdownForAnalysis(settingsRow);

  let lastError = "";
  let failedKind: MeetingAnalysisKind | undefined;

  const runKind = (kind: MeetingAnalysisKind) =>
    runMeetingAnalysis(
      {
        meetings: deps.meetings,
        prompts: deps.prompts,
        analysis: deps.analysis,
        aiLogs: deps.aiLogs,
      },
      {
        organizationId: input.organizationId,
        meetingId: input.meetingId,
        kind,
        jobId: input.jobId ?? null,
        kissSystemMarkdownAppendix: kind === "KISS" ? kissAppendix : undefined,
        organizationPlaybookMarkdown: playbookMarkdown,
      },
    );

  /*
    Deux vagues, et non une file.

    SONCAS, DISC et la scorecard ne lisent que le transcript : rien ne justifie
    de les faire attendre l'une derrière l'autre, et le commercial attendait
    trois appels au modèle là où un seul suffit. KISS, lui, relit SONCAS et
    DISC déjà enregistrés : il ne part qu'une fois la vague terminée, sans quoi
    il jugerait un rendez-vous dont le profil d'interlocuteur n'existe pas
    encore. Le compte rendu de visite, plus bas, relit tout.

    Les résultats de la vague sont dépouillés dans l'ordre de la liste, pour
    que le rendez-vous nomme toujours la même étape fautive quand deux échouent
    ensemble.
  */
  const FIRST_WAVE = ["SONCAS", "DISC", "SCORECARD"] as const;
  const firstWave = await Promise.all(FIRST_WAVE.map((kind) => runKind(kind)));

  for (let i = 0; i < FIRST_WAVE.length; i += 1) {
    const kind = FIRST_WAVE[i];
    const r = firstWave[i];
    /*
      Absence de grille : ce n'est pas un incident, c'est un type de rendez-vous
      qu'on ne sait pas encore noter. Le compter comme un échec marquerait le
      rendez-vous en FAILED et priverait le commercial de trois analyses réussies
      pour une fonctionnalité qui ne le concerne pas encore.
    */
    if (!r.ok && r.error === "NO_SCORECARD_GRID") {
      continue;
    }
    if (!r.ok) {
      lastError = r.message ?? r.error;
      failedKind = kind;
      break;
    }
  }

  if (!failedKind) {
    const r = await runKind("KISS");
    if (!r.ok) {
      lastError = r.message ?? r.error;
      failedKind = "KISS";
    }
  }

  if (failedKind) {
    await deps.meetings.updateMeetingStatus({
      id: meeting.id,
      organizationId: input.organizationId,
      status: "FAILED",
      errorMessage: lastError,
    });
    return {
      ok: false,
      error: "ANALYSIS_FAILED",
      message: lastError,
      failedKind,
    };
  }

  const disc = await deps.meetings.findLatestAnalysisForMeeting({
    meetingId: meeting.id,
    organizationId: input.organizationId,
    kind: "DISC",
  });
  const soncas = await deps.meetings.findLatestAnalysisForMeeting({
    meetingId: meeting.id,
    organizationId: input.organizationId,
    kind: "SONCAS",
  });
  const discParsed = disc ? discResultSchema.safeParse(disc.result) : null;
  const soncasParsed = soncas
    ? soncasResultSchema.safeParse(soncas.result)
    : null;
  if (discParsed?.success || soncasParsed?.success) {
    await deps.meetings.updatePersonProfileCache({
      personId: meeting.personId,
      organizationId: input.organizationId,
      discDominant: discParsed?.success ? discParsed.data.dominant : undefined,
      soncasDominant: soncasParsed?.success
        ? soncasParsed.data.dominant
        : undefined,
    });
  }

  /*
    Le compte rendu de visite n'est plus écrit ici. Il l'est à la demande, au
    fil de l'eau, la première fois qu'on ouvre la fiche : le rendez-vous est
    prêt un appel au modèle plus tôt, et le commercial voit le texte se
    composer au lieu d'attendre un paragraphe fini.
  */
  await deps.meetings.updateMeetingStatus({
    id: meeting.id,
    organizationId: input.organizationId,
    status: "READY",
    errorMessage: null,
  });

  if (input.notifyOnComplete !== false && deps.notifications) {
    await deps.notifications.create({
      organizationId: input.organizationId,
      userId: meeting.sellerUserId,
      title: "Analyse terminée",
      body: `Votre rendez-vous avec ${meeting.prospectName} est prêt.`,
      href: `/company/rendez-vous/${meeting.id}`,
    });

    if (deps.users) {
      const sellerEmail = await deps.users.findEmailById(meeting.sellerUserId);
      if (sellerEmail) {
        await sendTransactionalEmail({
          to: sellerEmail,
          subject: "Sales Time · Votre analyse de RDV est prête",
          html: `<p>Bonjour,</p><p>L'analyse de votre rendez-vous avec <strong>${meeting.prospectName}</strong> est disponible.</p><p><a href="${process.env.APP_BASE_URL ?? ""}/company/rendez-vous/${meeting.id}">Voir la fiche RDV</a></p>`,
        }).catch(() => undefined);
      }
    }
  }

  return { ok: true };
}
