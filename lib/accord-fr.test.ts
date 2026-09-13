import { describe, expect, it } from "@jest/globals";
import { membres, membresClasses, rdvNotes } from "./accord-fr";

describe("accord des dénombrements", () => {
  it("garde le singulier à zéro et à un", () => {
    expect(membres(0)).toBe("0 membre");
    expect(membres(1)).toBe("1 membre");
    expect(membresClasses(0)).toBe("0 membre classé");
    expect(membresClasses(1)).toBe("1 membre classé");
    expect(rdvNotes(0)).toBe("0 RDV noté");
    expect(rdvNotes(1)).toBe("1 RDV noté");
  });

  it("passe au pluriel à partir de deux", () => {
    expect(membres(2)).toBe("2 membres");
    expect(membres(7)).toBe("7 membres");
    expect(membresClasses(2)).toBe("2 membres classés");
    expect(membresClasses(7)).toBe("7 membres classés");
    expect(rdvNotes(2)).toBe("2 RDV notés");
    expect(rdvNotes(8)).toBe("8 RDV notés");
  });

  it("accorde le nom et le participe ensemble, jamais séparément", () => {
    /*
      La faute d'origine : « membre » venait d'un côté, « classés » de l'autre.
      Le test la refuse explicitement, plutôt que de se contenter de valider la
      forme correcte.
    */
    expect(membresClasses(1)).not.toContain("classés");
    expect(membresClasses(2)).not.toMatch(/\bmembre classé\b/);
  });
});
