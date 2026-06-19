import {
  DEFAULT_MEETING_TYPES,
  DEFAULT_PIPELINE_STAGES,
} from "@/lib/onboarding-defaults";
import { orgMeetingFormOptionsFromSettings } from "@/lib/org-meeting-form-options";

describe("orgMeetingFormOptionsFromSettings", () => {
  it("returns org-configured meeting types and pipeline stages", () => {
    const options = orgMeetingFormOptionsFromSettings({
      meetingTypes: ["Appel découverte", "Closing"],
      pipelineStages: ["MQL", "SQL", "Closed won"],
    } as never);

    expect(options.meetingTypeOptions).toEqual([
      "Appel découverte",
      "Closing",
    ]);
    expect(options.pipelineStageOptions).toEqual(["MQL", "SQL", "Closed won"]);
  });

  it("falls back to onboarding defaults when settings are missing", () => {
    const options = orgMeetingFormOptionsFromSettings(null);

    expect(options.meetingTypeOptions).toEqual([...DEFAULT_MEETING_TYPES]);
    expect(options.pipelineStageOptions).toEqual([...DEFAULT_PIPELINE_STAGES]);
  });
});
