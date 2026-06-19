export type MeetingEtapeSource = {
  meetingType: string | null;
  pipelineStage: string | null;
};

/** Libellé « Étape » — type de RDV prioritaire, puis étape pipeline. */
export function meetingEtapeDisplayLabel(source: MeetingEtapeSource): string {
  const meetingType = source.meetingType?.trim();
  if (meetingType) return meetingType;
  const pipelineStage = source.pipelineStage?.trim();
  if (pipelineStage) return pipelineStage;
  return "—";
}
