import {
  weeklyManagerDigest,
  type DigestMeeting,
} from "./weekly-manager-digest";

function meeting(
  id: string,
  sellerUserId: string,
  salesScore: number | null,
  extra: Partial<DigestMeeting> = {},
): DigestMeeting {
  return {
    id,
    prospectName: `Prospect ${id}`,
    prospectCompany: null,
    sellerUserId,
    sellerFirstName: sellerUserId === "s1" ? "Sophie" : "Lucas",
    sellerLastName: sellerUserId === "s1" ? "Martin" : "Bernard",
    sellerEmail: `${sellerUserId}@acme.test`,
    meetingAt: new Date("2026-09-22T10:00:00Z"),
    salesScore,
    hasKiss: salesScore != null,
    ...extra,
  };
}

const members = [
  {
    userId: "m1",
    firstName: "Marie",
    lastName: "Dubois",
    email: "m@acme.test",
    role: "ADMIN" as const,
  },
  {
    userId: "s1",
    firstName: "Sophie",
    lastName: "Martin",
    email: "s1@acme.test",
    role: "MEMBER" as const,
  },
  {
    userId: "s2",
    firstName: "Lucas",
    lastName: "Bernard",
    email: "s2@acme.test",
    role: "MEMBER" as const,
  },
  {
    userId: "s3",
    firstName: "Emma",
    lastName: "Leroy",
    email: "s3@acme.test",
    role: "MEMBER" as const,
  },
];

describe("weeklyManagerDigest", () => {
  it("ne dit rien quand deux semaines sont vides", () => {
    expect(
      weeklyManagerDigest({ meetings: [], previousMeetings: [], members }),
    ).toBeNull();
  });

  it("résume la semaine, la compare à la précédente et nomme les silencieux", () => {
    const digest = weeklyManagerDigest({
      meetings: [
        meeting("a", "s1", 82),
        meeting("b", "s1", 40),
        meeting("c", "s2", 61),
        meeting("d", "s2", null, { hasKiss: false }),
      ],
      previousMeetings: [meeting("p1", "s1", 55), meeting("p2", "s2", 65)],
      members,
    });

    expect(digest).not.toBeNull();
    expect(digest?.meetingsCount).toBe(4);
    expect(digest?.analyzedCount).toBe(3);
    expect(digest?.previousMeetingsCount).toBe(2);
    expect(digest?.averageSalesScore).toBe(61);
    expect(digest?.previousAverageSalesScore).toBe(60);
    expect(digest?.salesScoreDelta).toBe(1);
    expect(digest?.bestMeetings.map((m) => m.id)).toEqual(["a", "c", "b"]);
    expect(digest?.meetingsToReview).toEqual([]);
    expect(digest?.silentSellers).toEqual(["Emma Leroy"]);
  });

  /*
    Avec assez de rendez-vous notés, les moins bons sont listés à part, sans
    jamais reprendre un rendez-vous déjà cité parmi les meilleurs.
  */
  it("sépare les meilleurs des rendez-vous à relire", () => {
    const digest = weeklyManagerDigest({
      meetings: [
        meeting("a", "s1", 90),
        meeting("b", "s1", 80),
        meeting("c", "s2", 70),
        meeting("d", "s2", 30),
        meeting("e", "s2", 45),
      ],
      previousMeetings: [],
      members,
    });

    expect(digest?.bestMeetings.map((m) => m.id)).toEqual(["a", "b", "c"]);
    expect(digest?.meetingsToReview.map((m) => m.id)).toEqual(["d", "e"]);
    expect(digest?.salesScoreDelta).toBeNull();
  });

  it("écrit le nom du commercial, ou son e-mail à défaut", () => {
    const digest = weeklyManagerDigest({
      meetings: [
        meeting("a", "s9", 70, {
          sellerFirstName: null,
          sellerLastName: null,
          sellerEmail: "anonyme@acme.test",
        }),
      ],
      previousMeetings: [],
      members: [],
    });

    expect(digest?.bestMeetings[0]?.sellerName).toBe("anonyme@acme.test");
  });
});
