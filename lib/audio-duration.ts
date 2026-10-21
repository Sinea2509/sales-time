/**
 * La durée d'un enregistrement, en minutes arrondies, lue par le navigateur
 * dans les métadonnées du fichier. Null si le navigateur ne sait pas la lire :
 * c'est une aide à la saisie, pas une donnée nécessaire.
 */
export function readAudioDurationMin(file: File): Promise<number | null> {
  if (typeof window === "undefined" || typeof Audio === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = window.setTimeout(() => done(null), 5_000);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      window.clearTimeout(timer);
      const seconds = audio.duration;
      done(
        Number.isFinite(seconds) && seconds > 0
          ? Math.max(1, Math.round(seconds / 60))
          : null,
      );
    };
    audio.onerror = () => {
      window.clearTimeout(timer);
      done(null);
    };
    audio.src = url;
  });
}
