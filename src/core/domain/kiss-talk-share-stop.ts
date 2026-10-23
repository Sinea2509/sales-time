import {
  TALK_SHARE_CEILING_PCT,
  type TalkShare,
} from "./talk-share-from-transcript";

/**
 * « À arrêter » ne reste pas vide quand le commercial a trop parlé.
 *
 * La revue du 5 octobre 2026 l'a relevé : un commercial à 60 % de parole
 * recevait un « à arrêter » vide. La consigne le demande désormais au modèle ;
 * le produit le garantit, avec le chiffre mesuré, quand le modèle ne l'a pas
 * fait.
 */
export function kissStopWithTalkShare<T extends { stop: string[] }>(
  result: T,
  talkShare: TalkShare | null,
): T {
  if (!talkShare || talkShare.commercialPct <= TALK_SHARE_CEILING_PCT) {
    return result;
  }
  const alreadySaid = result.stop.some((s) =>
    /parle|parlé|parole|monologue/i.test(s),
  );
  if (alreadySaid) return result;
  // Dans la voix du coach, comme le reste du coaching (retour du 21 octobre 2026).
  const bullet = `Vous avez parlé ${talkShare.commercialPct} % du temps, au-delà des ${TALK_SHARE_CEILING_PCT} % qui laissent la place à votre interlocuteur, avec une prise de parole de ${talkShare.longestCommercialRunWords} mots d'affilée. La prochaine fois, coupez ces longs passages par une question : c'est à lui de parler le plus.`;
  return { ...result, stop: [bullet, ...result.stop] };
}
