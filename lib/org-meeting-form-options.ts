import {
  DEFAULT_MEETING_TYPES,
  DEFAULT_PIPELINE_STAGES,
} from "@/lib/onboarding-defaults";
import { stringArrayFromOrgJson } from "@/lib/org-settings-json";
import type { OrganizationSettingsRow } from "@/src/core/ports/organization-settings-repository-port";

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
