import { objectionsResultSchema } from "./objections-result-zod";

describe("objectionsResultSchema", () => {
  it("accepte une analyse sans objection, résumé vide compris", () => {
    expect(
      objectionsResultSchema.safeParse({ objections: [], summary: "" }).success,
    ).toBe(true);
  });

  it("exige les quatre volets et un état pour chaque objection", () => {
    const parsed = objectionsResultSchema.safeParse({
      objections: [
        {
          objection: "On verra selon ce que vous proposez.",
          who: "Le prospect",
          moment: null,
          response: "Aucune relance : l'échange est passé à la démonstration.",
          effect: "L'objection n'est pas traitée.",
          outcome: "open",
          suggestion:
            "Reposez la question : « Ce serait quoi, dans les clous, à votre avis ? »",
        },
      ],
      summary: "Une objection, laissée ouverte.",
    });
    expect(parsed.success).toBe(true);

    const sansEtat = objectionsResultSchema.safeParse({
      objections: [
        {
          objection: "Trop cher.",
          who: "Le prospect",
          moment: null,
          response: "Une remise a été proposée.",
          effect: "Le prospect n'a rien dit.",
          suggestion: "Demandez : « Trop cher par rapport à quoi ? »",
        },
      ],
      summary: "",
    });
    expect(sansEtat.success).toBe(false);
  });
});
