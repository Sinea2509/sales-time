import { followUpMeetingTypes } from "./follow-up-meeting-types";

describe("followUpMeetingTypes", () => {
  it("écarte la qualification et la découverte, accents ou non", () => {
    expect(
      followUpMeetingTypes([
        "Qualification",
        "Découverte",
        "Decouverte approfondie",
        "Démo",
        "Closing",
      ]),
    ).toEqual(["Decouverte approfondie", "Démo", "Closing"]);
  });

  it("rend la liste entière plutôt qu'un sélecteur vide", () => {
    expect(followUpMeetingTypes(["Qualification", "Découverte"])).toEqual([
      "Qualification",
      "Découverte",
    ]);
  });
});
