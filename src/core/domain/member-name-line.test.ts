import { describe, expect, it } from "@jest/globals";
import { memberNameLine } from "./member-name-line";

/**
 * Ce que ce test ne couvre pas : l'ordre prénom puis nom est celui du français
 * et n'est pas réglable ; rien ici ne garde une organisation qui écrirait ses
 * noms dans l'autre sens.
 */
describe("memberNameLine", () => {
  const email = "camille@exemple.fr";

  it("assemble le prénom et le nom quand les deux sont là", () => {
    expect(
      memberNameLine({ firstName: "Camille", lastName: "Roy", email }),
    ).toBe("Camille Roy");
  });

  it("se contente de celui des deux qui est renseigné", () => {
    expect(
      memberNameLine({ firstName: "Camille", lastName: null, email }),
    ).toBe("Camille");
    expect(memberNameLine({ firstName: null, lastName: "Roy", email })).toBe(
      "Roy",
    );
  });

  it("retombe sur l'adresse quand aucun des deux ne l'est", () => {
    expect(memberNameLine({ firstName: null, lastName: null, email })).toBe(
      email,
    );
    expect(
      memberNameLine({ firstName: undefined, lastName: undefined, email }),
    ).toBe(email);
  });

  it("traite une saisie faite de blancs comme une absence", () => {
    expect(memberNameLine({ firstName: "   ", lastName: "\t", email })).toBe(
      email,
    );
  });

  it("rogne les blancs autour des noms plutôt que de les afficher", () => {
    expect(
      memberNameLine({ firstName: "  Camille ", lastName: " Roy  ", email }),
    ).toBe("Camille Roy");
  });
});
