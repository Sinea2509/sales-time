import { describe, expect, it } from "@jest/globals";
import { z } from "zod";
import { objectionsGeneratedResultSchema } from "./objections-result-zod";

/**
 * Les formats imposés d'OpenAI exigent que chaque champ soit obligatoire.
 * Un champ facultatif dans le format envoyé au modèle fait échouer l'analyse
 * des objections à chaque rendez-vous (incident du 6 octobre 2026).
 */
describe("objectionsGeneratedResultSchema", () => {
  it("n'envoie au modèle aucun champ facultatif", () => {
    const json = JSON.stringify(
      z.toJSONSchema(objectionsGeneratedResultSchema),
    );
    const schema = JSON.parse(json) as {
      properties: {
        objections: { items: { properties: object; required: string[] } };
      };
    };
    const item = schema.properties.objections.items;
    expect(new Set(item.required)).toEqual(
      new Set(Object.keys(item.properties)),
    );
    expect(Object.keys(item.properties)).not.toContain("verbatim");
  });
});
