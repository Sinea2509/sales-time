import { describe, expect, it } from "@jest/globals";
import { TypeValidationError } from "ai";
import { z } from "zod";
import { repairStructuredOutput } from "./repair-structured-output";

const schema = z.object({
  resume: z.string().min(1).max(10),
  bloc: z.object({ texte: z.string() }),
  liste: z.array(z.object({ nom: z.string().max(10) })).max(2),
  suite: z.object({ quand: z.string() }),
  competences: z.string().max(14).nullable(),
});

const BLOC = JSON.stringify({ texte: "Un concurrent cité." });
const LISTE = JSON.stringify([{ nom: "Prix" }]);
const SUITE = JSON.stringify({ quand: "Mardi" });
const COMPLET = {
  resume: "S.",
  bloc: { texte: "Un concurrent cité." },
  liste: [{ nom: "Prix" }],
  suite: { quand: "Mardi" },
  competences: null,
};

function repaired(value: unknown) {
  const parsed = schema.safeParse(value);
  if (parsed.success) throw new Error("devait échouer");
  return repairStructuredOutput(schema)({
    text: JSON.stringify(value),
    error: new TypeValidationError({ value, cause: parsed.error }),
  });
}

describe("repairStructuredOutput", () => {
  it("coupe un texte et une liste trop longs, et rend une réponse conforme", async () => {
    const text = await repaired({
      ...COMPLET,
      resume: "Bien trop long pour tenir.",
      liste: [{ nom: "a" }, { nom: "b" }, { nom: "c" }],
    });
    const fixed = schema.parse(JSON.parse(text!));
    expect(fixed.resume).toBe("Bien trop");
    expect(fixed.liste).toHaveLength(2);
  });

  describe("une rubrique rendue en texte", () => {
    it("la remet en place", async () => {
      const text = await repaired({ ...COMPLET, bloc: BLOC });
      expect(schema.parse(JSON.parse(text!))).toEqual(COMPLET);
    });

    it("récupère ce qu'elle a emporté", async () => {
      const text = await repaired({
        resume: "S.",
        bloc: `${BLOC}, "liste": ${LISTE}`,
        suite: JSON.parse(SUITE),
        competences: null,
      });
      expect(schema.parse(JSON.parse(text!))).toEqual(COMPLET);
    });

    it("lit un texte fermé par l'accolade de la réponse entière", async () => {
      const text = await repaired({
        resume: "S.",
        bloc: `${BLOC}, "liste": ${LISTE}, "suite": ${SUITE}, "competences": null}`,
      });
      expect(schema.parse(JSON.parse(text!))).toEqual(COMPLET);
    });

    it("lit un texte fermé par un crochet en trop", async () => {
      const text = await repaired({ ...COMPLET, bloc: `${BLOC}]` });
      expect(schema.parse(JSON.parse(text!))).toEqual(COMPLET);
    });

    it("répare deux rubriques dans la même réponse", async () => {
      const text = await repaired({
        resume: "S.",
        bloc: `${BLOC}, "liste": ${LISTE}`,
        suite: SUITE,
        competences: null,
      });
      expect(schema.parse(JSON.parse(text!))).toEqual(COMPLET);
    });

    it("coupe ce qu'elle cachait de trop long", async () => {
      const longue = JSON.stringify([{ nom: "Bien trop long" }]);
      const text = await repaired({
        resume: "S.",
        bloc: `${BLOC}, "liste": ${longue}`,
        suite: JSON.parse(SUITE),
        competences: null,
      });
      expect(schema.parse(JSON.parse(text!)).liste[0].nom).toBe("Bien trop");
    });

    it("laisse refuser un texte qui n'est pas du JSON", async () => {
      expect(
        await repaired({ ...COMPLET, bloc: "Un concurrent cité." }),
      ).toBeNull();
    });
  });

  describe("une liste à la place d'un texte", () => {
    it("la joint en un seul texte", async () => {
      const text = await repaired({
        ...COMPLET,
        competences: ["Écoute", "Vente"],
      });
      expect(schema.parse(JSON.parse(text!)).competences).toBe("Écoute, Vente");
    });

    it("coupe le texte joint s'il dépasse", async () => {
      const text = await repaired({
        ...COMPLET,
        competences: ["Écoute active", "Négociation"],
      });
      expect(schema.parse(JSON.parse(text!)).competences).toBe(
        "Écoute active,",
      );
    });

    it("laisse refuser une liste d'objets", async () => {
      expect(
        await repaired({ ...COMPLET, competences: [{ nom: "Écoute" }] }),
      ).toBeNull();
    });
  });

  it("répare en une fois des écarts de natures différentes", async () => {
    const text = await repaired({
      ...COMPLET,
      resume: "Bien trop long pour tenir.",
      bloc: BLOC,
      liste: [{ nom: "a" }, { nom: "b" }, { nom: "c" }],
      competences: ["Écoute", "Vente"],
    });
    const fixed = schema.parse(JSON.parse(text!));
    expect(fixed.resume).toBe("Bien trop");
    expect(fixed.bloc.texte).toBe("Un concurrent cité.");
    expect(fixed.liste).toHaveLength(2);
    expect(fixed.competences).toBe("Écoute, Vente");
  });

  it("laisse refuser une rubrique vraiment absente", async () => {
    expect(await repaired({ resume: "S." })).toBeNull();
  });

  it("laisse refuser ce qu'elle ne sait pas réparer", async () => {
    expect(await repaired({ ...COMPLET, resume: "" })).toBeNull();
  });

  it("laisse passer une autre erreur que le format", async () => {
    expect(
      await repairStructuredOutput(schema)({
        text: "{}",
        error: new Error("panne"),
      }),
    ).toBeNull();
  });
});
