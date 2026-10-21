/** Le message à montrer quand le dépôt ou la modification d’un rendez-vous échoue. */
export function meetingSubmitErrorMessage(
  res: { ok: false; error: string },
  isEditMode: boolean,
): string {
  if (res.error === "VALIDATION") {
    return "Vérifiez les champs obligatoires.";
  }
  if (res.error === "INVALID_PERSON") {
    return "Contact introuvable. Rechargez la page ou choisissez un autre contact.";
  }
  if (res.error === "QUOTA_EXHAUSTED") {
    return "Quota d'analyses épuisé. Passez au plan pour continuer.";
  }
  if (res.error === "UNSUPPORTED_FORMAT") {
    return "Format non pris en charge (.txt, .csv, .md, .vtt, .srt, .doc, .docx, .pdf).";
  }
  if (res.error === "TRANSCRIPT_TOO_SHORT") {
    return "Le transcript est trop court (minimum 20 caractères).";
  }
  if (res.error === "TRANSCRIPT_TOO_SHORT_FOR_ANALYSIS") {
    return "Votre transcript est trop court pour être analysé.";
  }
  if (res.error === "EXTRACTION_FAILED") {
    return "Impossible de lire le contenu du fichier. Vérifiez qu'il n'est pas protégé ou corrompu, ou collez le texte.";
  }
  if (res.error === "AUDIO_TOO_LARGE") {
    return "Enregistrement trop lourd (maximum 20 Mo, environ 45 minutes en m4a). Coupez-le ou compressez-le.";
  }
  if (res.error === "AUDIO_NOT_FOUND") {
    return "L'enregistrement n'a pas été retrouvé. Réessayez l'envoi.";
  }
  if (res.error === "TRANSCRIPTION_FAILED") {
    return "La transcription a échoué. Réessayez dans un instant, ou collez le transcript si vous l'avez.";
  }
  if (res.error === "AI_NOT_CONFIGURED") {
    return "La transcription n'est pas disponible sur cette plateforme.";
  }
  if (res.error === "FORBIDDEN" || res.error === "NOT_FOUND") {
    return isEditMode
      ? "Impossible de modifier ce rendez-vous."
      : "Impossible d'enregistrer ce rendez-vous.";
  }
  return res.error;
}
