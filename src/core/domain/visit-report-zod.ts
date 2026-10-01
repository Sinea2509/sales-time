import { z } from "zod";

/**
 * Ce que le modèle extrait du transcript pour le compte rendu de visite.
 *
 * Le compte rendu validé à la revue du 2 septembre mêle deux sortes de
 * rubriques. Les unes ne se lisent que dans le transcript : qui était là, ce
 * qui a été dit thème par thème, les objections et la réponse apportée, les
 * engagements, le prochain rendez-vous. Les autres existent déjà ailleurs dans
 * le produit : le profil SONCAS et DISC, la maturité et la qualité tirées de la
 * grille, l'historique du compte tiré de la base. Le modèle ne produit que les
 * premières ; le produit assemble le tout, si bien qu'un chiffre de la grille
 * ne peut pas différer entre la fiche et le texte collé dans le CRM.
 *
 * Aucun champ n'est facultatif ni nul : une rubrique sans matière dans le
 * transcript revient vide (texte vide, liste vide), et c'est l'assemblage qui
 * écrit qu'elle n'a pas été abordée. Des champs nuls auraient dépendu de la
 * façon dont chaque fournisseur de modèle traduit un schéma ; une chaîne vide
 * se lit partout de la même manière.
 *
 * Les plafonds de longueur sont larges exprès. Le modèle les lit comme des
 * indications, mais le schéma les vérifie après coup : un seul titre trop long
 * ferait perdre tout le compte rendu, remplacé par le texte de secours. La
 * longueur voulue se règle dans la consigne ; les plafonds n'arrêtent qu'un
 * texte qui s'emballe.
 */

/** Des mots prononcés, par qui, et à quel moment quand le transcript le dit. */
export const visitReportQuoteSchema = z.object({
  qui: z.string().max(200),
  texte: z.string().max(1000),
  /** L'horodatage tel que le transcript le porte (« 14'30 »), vide sinon. */
  moment: z.string().max(40),
});

/** Une personne présente, ou citée sans être là. */
export const visitReportParticipantSchema = z.object({
  nom: z.string().max(200),
  role: z.string().max(300),
  statut: z.string().max(400),
});

/** Un thème du rendez-vous : une synthèse, puis les mots du prospect. */
export const visitReportThemeSchema = z.object({
  titre: z.string().max(200),
  texte: z.string().max(2500),
  citations: z.array(visitReportQuoteSchema).max(6),
});

/** Une rubrique facultative du corps : vide quand le sujet n'est pas venu. */
export const visitReportBlockSchema = z.object({
  texte: z.string().max(2000),
  citations: z.array(visitReportQuoteSchema).max(6),
});

export const visitReportObjectionSchema = z.object({
  qui: z.string().max(200),
  /** L'horodatage tel que le transcript le porte (« 14'30 »), vide sinon. */
  moment: z.string().max(40),
  /** Les mots du prospect, tels qu'il les a dits. */
  objection: z.string().max(1000),
  reponse: z.string().max(1200),
  effet: z.string().max(600),
});

export const visitReportNextMeetingSchema = z.object({
  /** Vide quand aucun rendez-vous n'a été fixé pendant l'échange. */
  quand: z.string().max(400),
  objectif: z.string().max(1000),
  participants: z.string().max(600),
  aPreparer: z.string().max(1000),
});

export const visitReportNextStepSchema = z.object({
  action: z.string().max(600),
  echeance: z.string().max(300),
  porteur: z.string().max(200),
});

export const visitReportExtractionSchema = z.object({
  enUnePhrase: z.string().min(1).max(2000),
  participants: z.object({
    client: z.array(visitReportParticipantSchema).max(20),
    nous: z.array(visitReportParticipantSchema).max(12),
    cites: z.array(visitReportParticipantSchema).max(20),
  }),
  origine: z.string().max(1000),
  themes: z.array(visitReportThemeSchema).max(10),
  perimetre: visitReportBlockSchema,
  concurrence: visitReportBlockSchema,
  objections: z.array(visitReportObjectionSchema).max(12),
  engagements: z.object({
    texte: z.string().max(1500),
    liste: z.array(z.string().max(600)).max(15),
    citations: z.array(visitReportQuoteSchema).max(6),
  }),
  prochainRendezVous: visitReportNextMeetingSchema,
  prochainesEtapes: z.array(visitReportNextStepSchema).max(15),
});

export type VisitReportQuote = z.infer<typeof visitReportQuoteSchema>;
export type VisitReportParticipant = z.infer<
  typeof visitReportParticipantSchema
>;
export type VisitReportExtraction = z.infer<typeof visitReportExtractionSchema>;
