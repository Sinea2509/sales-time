import { describe, expect, it } from "@jest/globals";
import { TypeValidationError } from "ai";
import { z } from "zod";
import { repairStructuredOutput } from "./repair-structured-output";

const schema = z.object({
  resume: z.string().max(10),
  bloc: z.object({ texte: z.string() }),
  liste: z.array(z.object({ nom: z.string() })),
  suite: z.object({ quand: z.string() }),
});

const BLOC = JSON.stringify({ texte: "Un concurrent cité." });
const LISTE = JSON.stringify([{ nom: "Prix" }]);
const SUITE = JSON.stringify({ quand: "Mardi" });
const COMPLET = {
  resume: "S.",
  bloc: { texte: "Un concurrent cité." },
  liste: [{ nom: "Prix" }],
  suite: { quand: "Mardi" },
};

function repaired(value: unknown) {
  const parsed = schema.safeParse(value);
  if (parsed.success) throw new Error("devait échouer");
  return repairStructuredOutput({
    text: JSON.stringify(value),
    error: new TypeValidationError({ value, cause: parsed.error }),
  });
}

describe("repairStructuredOutput", () => {
  it("remet en place une rubrique rendue en texte", async () => {
    const text = await repaired({
      resume: "S.",
      bloc: BLOC,
      liste: JSON.parse(LISTE),
      suite: JSON.parse(SUITE),
    });
    expect(schema.parse(JSON.parse(text!))).toEqual(COMPLET);
  });

  it("récupère ce que la rubrique a emporté", async () => {
    const text = await repaired({
      resume: "S.",
      bloc: `${BLOC}, "liste": ${LISTE}`,
      suite: JSON.parse(SUITE),
    });
    expect(schema.parse(JSON.parse(text!))).toEqual(COMPLET);
  });

  it("lit un texte fermé par l'accolade de la réponse entière", async () => {
    const text = await repaired({
      resume: "S.",
      bloc: `${BLOC}, "liste": ${LISTE}, "suite": ${SUITE}}`,
    });
    expect(schema.parse(JSON.parse(text!))).toEqual(COMPLET);
  });

  it("lit un texte fermé par un crochet en trop", async () => {
    const text = await repaired({
      resume: "S.",
      bloc: `${BLOC}]`,
      liste: JSON.parse(LISTE),
      suite: JSON.parse(SUITE),
    });
    expect(schema.parse(JSON.parse(text!))).toEqual(COMPLET);
  });

  it("répare deux rubriques dans la même réponse", async () => {
    const text = await repaired({
      resume: "S.",
      bloc: `${BLOC}, "liste": ${LISTE}`,
      suite: SUITE,
    });
    expect(schema.parse(JSON.parse(text!))).toEqual(COMPLET);
  });

  it("laisse refuser un texte qui n'est pas du JSON", async () => {
    expect(
      await repaired({
        resume: "S.",
        bloc: "Un concurrent cité.",
        liste: [],
        suite: JSON.parse(SUITE),
      }),
    ).toBeNull();
  });

  it("laisse refuser une rubrique vraiment absente", async () => {
    expect(await repaired({ resume: "S." })).toBeNull();
  });

  it("coupe toujours un texte trop long", async () => {
    const text = await repaired({
      ...COMPLET,
      resume: "Bien trop long pour tenir.",
    });
    expect(schema.parse(JSON.parse(text!)).resume).toBe("Bien trop");
  });
});
