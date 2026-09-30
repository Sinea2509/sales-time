/**
 * Ce que Sales Time accepte comme enregistrement d'un rendez-vous, et sous
 * quel type il l'envoie au modèle qui le transcrit.
 *
 * Vingt mégaoctets : la limite d'une pièce jointe audio envoyée en une seule
 * requête au modèle. C'est environ quarante-cinq minutes en m4a ou aac à
 * 64 kb/s, une vingtaine en mp3 à 128 kb/s. Un enregistrement plus long doit
 * être coupé, ou compressé, avant l'envoi.
 */
export const AUDIO_MAX_BYTES = 20 * 1024 * 1024;

export const AUDIO_ACCEPT = ".mp3,.m4a,.aac,.wav,.webm,.ogg,.opus,audio/*";

/** Ce que le jeton de téléversement autorise ; les jokers sont acceptés. */
export const AUDIO_ALLOWED_CONTENT_TYPES = ["audio/*"];

const MEDIA_TYPE_BY_EXTENSION: Readonly<Record<string, string>> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
  ".ogg": "audio/ogg",
  ".opus": "audio/ogg",
  ".flac": "audio/flac",
};

export function isAudioFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  return Object.keys(MEDIA_TYPE_BY_EXTENSION).some((ext) =>
    lower.endsWith(ext),
  );
}

/**
 * Le type MIME à déclarer, l'extension faisant foi sur le type annoncé par
 * le navigateur : Windows envoie parfois « audio/x-m4a », ou rien du tout,
 * pour un m4a que le modèle sait lire sous « audio/mp4 ».
 */
export function audioMediaTypeFor(
  filename: string,
  browserType: string,
): string {
  const lower = filename.toLowerCase();
  for (const [ext, mediaType] of Object.entries(MEDIA_TYPE_BY_EXTENSION)) {
    if (lower.endsWith(ext)) return mediaType;
  }
  const declared = browserType.trim().toLowerCase();
  return declared.startsWith("audio/") ? declared : "audio/mpeg";
}

export function isSupportedAudioMediaType(mediaType: string): boolean {
  return mediaType.trim().toLowerCase().startsWith("audio/");
}
