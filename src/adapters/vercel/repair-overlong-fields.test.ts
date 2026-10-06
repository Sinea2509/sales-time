import { describe, expect, it } from "@jest/globals";
import { TypeValidationError } from "ai";
import { z } from "zod";
import { repairOverlongFields } from "./repair-overlong-fields";

const schema = z.object({
  moments: z
    .array(z.object({ moment: z.string().max(5), words: z.string() }))
    .max(2),
  summary: z.string().min(1),
});

function errorFor(value: unknown) {
  const parsed = schema.safeParse(value);
  if (parsed.success) throw new Error("devait échouer");
  return new TypeValidationError({ value, cause: parsed.error });
}

describe("repairOverlongFields", () => {
  it("coupe un texte et une liste trop longs, et rend une réponse conforme", async () => {
    const value = {
      moments: [
        { moment: "12:05 environ", words: "a" },
        { moment: "1:02", words: "b" },
        { moment: "2:00", words: "c" },
      ],
      summary: "S.",
    };
    const repaired = await repairOverlongFields({
      text: JSON.stringify(value),
      error: errorFor(value),
    });
    const fixed = schema.parse(JSON.parse(repaired!));
    expect(fixed.moments).toHaveLength(2);
    expect(fixed.moments[0].moment).toBe("12:05");
  });

  it("ne répare pas une autre erreur qu'un dépassement de longueur", async () => {
    const value = { moments: [], summary: "" };
    expect(
      await repairOverlongFields({
        text: JSON.stringify(value),
        error: errorFor(value),
      }),
    ).toBeNull();
  });
});
