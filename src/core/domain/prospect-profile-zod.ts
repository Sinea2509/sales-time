import { z } from "zod";
import { objectionsGeneratedResultSchema } from "./objections-result-zod";
import {
  discMomentsOutputSchema,
  soncasMomentsOutputSchema,
} from "./profile-moments";

/**
 * Les trois lectures du prospect, rendues en une seule réponse.
 *
 * SONCAS, DISC et les objections cherchent les mêmes moments du rendez-vous :
 * ce que le prospect attend, comment il réagit au prix, ce qui le retient.
 * Trois appels relisaient trois fois le même transcript, et chacun pouvait
 * retenir des passages différents pour décrire la même personne. Un seul
 * appel lit le rendez-vous une fois et rend les trois lectures, chacune selon
 * sa consigne ; le produit les vérifie et les enregistre ensuite séparément,
 * comme avant.
 */
export const prospectProfileGeneratedSchema = z.object({
  soncas: soncasMomentsOutputSchema,
  disc: discMomentsOutputSchema,
  objections: objectionsGeneratedResultSchema,
});

export type ProspectProfileGenerated = z.infer<
  typeof prospectProfileGeneratedSchema
>;

/** Les analyses enregistrées à partir d'une lecture du prospect. */
export const PROSPECT_PROFILE_KINDS = ["SONCAS", "DISC", "OBJECTIONS"] as const;
export type ProspectProfileKind = (typeof PROSPECT_PROFILE_KINDS)[number];
