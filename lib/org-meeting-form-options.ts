import { stringArrayFromOrgJson } from "@/lib/org-settings-json";
import type { OrganizationSettingsRow } from "@/src/core/ports/organization-settings-repository-port";

const DEFAULT_MEETING_TYPES = [
  "Découverte",
  "Démo",
  "Proposition",
  "Négociation",
] as const;

const DEFAULT_PIPELINE_STAGES = [
  "Lead",
  "Qualifié",
  "Proposition",
  "Gagné",
] as const;

export function orgMeetingFormOptionsFromSettings(
  settings: OrganizationSettingsRow | null,
) {
  return {
    meetingTypeOptions: stringArrayFromOrgJson(
      settings?.meetingTypes,
      [...DEFAULT_MEETING_TYPES],
    ),
    pipelineStageOptions: stringArrayFromOrgJson(
      settings?.pipelineStages,
      [...DEFAULT_PIPELINE_STAGES],
    ),
  };
}
