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
 */

/** Des mots prononcés, et par qui. */
export const visitReportQuoteSchema = z.object({
  qui: z.string().max(120),
  texte: z.string().max(600),
});

/** Une personne présente, ou citée sans être là. */
export const visitReportParticipantSchema = z.object({
  nom: z.string().max(120),
  role: z.string().max(160),
  statut: z.string().max(200),
});

/** Un thème du rendez-vous : une synthèse, puis les mots du prospect. */
export const visitReportThemeSchema = z.object({
  titre: z.string().max(80),
  texte: z.string().max(1500),
  citations: z.array(visitReportQuoteSchema).max(4),
});

/** Une rubrique facultative du corps : vide quand le sujet n'est pas venu. */
export const visitReportBlockSchema = z.object({
  texte: z.string().max(1200),
  citations: z.array(visitReportQuoteSchema).max(4),
});

export const visitReportObjectionSchema = z.object({
  qui: z.string().max(120),
  /** Les mots du prospect, tels qu'il les a dits. */
  objection: z.string().max(500),
  reponse: z.string().max(600),
  effet: z.string().max(400),
});

export const visitReportNextMeetingSchema = z.object({
  /** Vide quand aucun rendez-vous n'a été fixé pendant l'échange. */
  quand: z.string().max(200),
  objectif: z.string().max(500),
  participants: z.string().max(300),
  aPreparer: z.string().max(600),
});

export const visitReportNextStepSchema = z.object({
  action: z.string().max(300),
  echeance: z.string().max(120),
  porteur: z.string().max(120),
});

export const visitReportExtractionSchema = z.object({
  enUnePhrase: z.string().min(1).max(1200),
  participants: z.object({
    client: z.array(visitReportParticipantSchema).max(12),
    nous: z.array(visitReportParticipantSchema).max(8),
    cites: z.array(visitReportParticipantSchema).max(12),
  }),
  origine: z.string().max(600),
  themes: z.array(visitReportThemeSchema).max(8),
  perimetre: visitReportBlockSchema,
  concurrence: visitReportBlockSchema,
  objections: z.array(visitReportObjectionSchema).max(8),
  engagements: z.object({
    texte: z.string().max(800),
    liste: z.array(z.string().max(300)).max(10),
    citations: z.array(visitReportQuoteSchema).max(4),
  }),
  prochainRendezVous: visitReportNextMeetingSchema,
  prochainesEtapes: z.array(visitReportNextStepSchema).max(10),
  /** Une phrase pour s'adapter à l'interlocuteur, affichée sur la fiche. */
  interlocutorProfile: z.string().min(1).max(600),
});

export type VisitReportQuote = z.infer<typeof visitReportQuoteSchema>;
export type VisitReportParticipant = z.infer<
  typeof visitReportParticipantSchema
>;
export type VisitReportExtraction = z.infer<typeof visitReportExtractionSchema>;
