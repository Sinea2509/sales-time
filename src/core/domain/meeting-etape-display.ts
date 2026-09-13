export type MeetingEtapeSource = {
  meetingType: string | null;
  pipelineStage: string | null;
};

/**
 * Ce que l'écran affiche quand ni le type de rendez-vous ni l'étape de pipeline
 * ne sont renseignés.
 *
 * Un tiret seul ne dit pas de quoi il est le signe : donnée absente, valeur
 * nulle, ou champ que l'écran n'a pas su lire. Ces trois cas appellent trois
 * gestes différents de la part du commercial, et le premier est le seul qui
 * soit de son ressort. La constante est exportée parce que deux modules
 * reconnaissent ce cas pour le traiter à part ; une chaîne recopiée à la main
 * cesserait d'être reconnue à la première retouche du libellé.
 */
export const ETAPE_NON_RENSEIGNEE = "Non renseignée";

/** Libellé « Étape » : type de RDV prioritaire, puis étape pipeline. */
export function meetingEtapeDisplayLabel(source: MeetingEtapeSource): string {
  const meetingType = source.meetingType?.trim();
  if (meetingType) return meetingType;
  const pipelineStage = source.pipelineStage?.trim();
  if (pipelineStage) return pipelineStage;
  return ETAPE_NON_RENSEIGNEE;
}
