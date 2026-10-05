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
  const bullet = `Le commercial a parlé ${talkShare.commercialPct} % du temps, au-delà du plafond de ${TALK_SHARE_CEILING_PCT} %, avec une prise de parole de ${talkShare.longestCommercialRunWords} mots d'affilée. Nous vous suggérons de couper ces longs passages par une question au prospect, pour qu'il parle davantage que vous.`;
  return { ...result, stop: [bullet, ...result.stop] };
}
