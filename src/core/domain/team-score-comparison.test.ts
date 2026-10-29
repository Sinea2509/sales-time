import { teamScoresForComparison } from "./team-score-comparison";

const meetings = [
  { sellerUserId: "moi", salesScore: 52 },
  { sellerUserId: "voisin", salesScore: 70 },
  { sellerUserId: "voisin", salesScore: null },
  { sellerUserId: "autre-equipe", salesScore: 90 },
];

describe("teamScoresForComparison", () => {
  it("ne compare à rien un commercial sans équipe", () => {
    expect(
      teamScoresForComparison(meetings, {
        sellerUserId: "moi",
        teamUserIds: undefined,
      }),
    ).toBeNull();
  });

  it("ne compare pas un commercial seul de son équipe à lui-même", () => {
    expect(
      teamScoresForComparison(meetings, {
        sellerUserId: "moi",
        teamUserIds: ["manager", "moi"],
      }),
    ).toBeNull();
  });

  it("ne retient que les scores de l'équipe, pas ceux de l'organisation", () => {
    expect(
      teamScoresForComparison(meetings, {
        sellerUserId: "moi",
        teamUserIds: ["manager", "moi", "voisin"],
      }),
    ).toEqual([52, 70]);
  });
});
