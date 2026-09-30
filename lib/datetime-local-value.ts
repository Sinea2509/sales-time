import { toAppTimeZoneDatetimeLocal } from "@/src/core/domain/app-time-zone";

/**
 * La valeur d'un champ `<input type="datetime-local">` pour une date, en heure
 * de Paris.
 *
 * Le serveur relit ce champ comme une heure de Paris
 * (`parseWallClockInAppTimeZone`). L'écrire dans le fuseau du navigateur, ou
 * relire dans celui du serveur, décalait le rendez-vous de deux heures à
 * chaque enregistrement.
 */
export function toDatetimeLocalValue(date: Date): string {
  return toAppTimeZoneDatetimeLocal(date);
}
