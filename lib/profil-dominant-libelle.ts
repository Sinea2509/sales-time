import {
  DISC_LABEL_FR,
  SONCAS_LABEL_FR,
} from "@/src/core/domain/seller-affinity-from-meetings";

/**
 * Les libellés français d'un profil dominant, quel que soit ce que l'IA renvoie.
 *
 * `discDominant` et `soncasDominant` du briefing sont typés `string` libre, et
 * le modèle reçoit les analyses stockées telles quelles : leur champ `dominant`
 * vaut « D » ou « securite ». Le modèle les recopie donc le plus souvent à
 * l'identique, et l'écran affichait « DISC D · SONCAS securite », c'est-à-dire
 * le vocabulaire interne de la base, sans accent, à un commercial qui prépare
 * son rendez-vous.
 *
 * La normalisation ne peut pas vivre dans le prompt : un super-administrateur
 * peut le réécrire entièrement depuis l'interface, et la sortie redeviendrait
 * quelconque. Elle vit donc du côté de l'affichage, et elle est tolérante :
 * la clé, le libellé accentué et le libellé sans accent tombent tous sur le
 * même mot. Ce qui ne se reconnaît pas est affiché tel quel, car une valeur
 * inattendue reste une information : la remplacer par un tiret la perdrait.
 */
function sansAccentEnMinuscules(valeur: string): string {
  return (
    valeur
      .trim()
      .toLowerCase()
      // NFD sépare « é » en « e » + accent combinant ; la plage U+0300 à
      // U+036F est écrite en échappement, car ces caractères sont invisibles
      // dans un fichier source et se perdent silencieusement à la copie.
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  );
}

function indexer(libelles: Record<string, string>): Map<string, string> {
  const index = new Map<string, string>();
  for (const [cle, libelle] of Object.entries(libelles)) {
    index.set(sansAccentEnMinuscules(cle), libelle);
    index.set(sansAccentEnMinuscules(libelle), libelle);
  }
  return index;
}

const INDEX_DISC = indexer(DISC_LABEL_FR);
const INDEX_SONCAS = indexer(SONCAS_LABEL_FR);

function libelle(
  index: Map<string, string>,
  brut: string | null,
): string | null {
  if (brut == null) return null;
  const nettoye = brut.trim();
  if (nettoye === "") return null;
  return index.get(sansAccentEnMinuscules(nettoye)) ?? nettoye;
}

/** « D » ou « dominant » deviennent « Dominant ». */
export function libelleDiscDominant(brut: string | null): string | null {
  return libelle(INDEX_DISC, brut);
}

/** « securite » ou « Sécurité » deviennent « Sécurité ». */
export function libelleSoncasDominant(brut: string | null): string | null {
  return libelle(INDEX_SONCAS, brut);
}
