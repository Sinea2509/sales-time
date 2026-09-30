import { sendWeeklyManagerDigests } from "./send-weekly-manager-digests";

const NOW = new Date("2026-09-28T06:00:00Z");

function meetingRow(
  id: string,
  sellerUserId: string,
  salesScore: number | null,
) {
  return {
    id,
    prospectName: `Prospect ${id}`,
    prospectCompany: "Acme",
    sellerUserId,
    sellerFirstName: "Sophie",
    sellerLastName: "Martin",
    sellerEmail: "sophie@acme.test",
    meetingAt: new Date("2026-09-24T10:00:00Z"),
    salesScore,
    hasKiss: salesScore != null,
  };
}

function makeDeps(overrides: {
  meetings?: ReturnType<typeof meetingRow>[];
  previous?: ReturnType<typeof meetingRow>[];
  members?: Array<{
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: "ADMIN" | "MEMBER";
  }>;
}) {
  const members = overrides.members ?? [
    {
      userId: "m1",
      email: "manager@acme.test",
      firstName: "Marie",
      lastName: "Dubois",
      role: "ADMIN" as const,
    },
    {
      userId: "s1",
      email: "sophie@acme.test",
      firstName: "Sophie",
      lastName: "Martin",
      role: "MEMBER" as const,
    },
  ];
  const listRecentMeetingsForDashboard = jest
    .fn()
    .mockImplementation(async (input: { meetingAtBefore?: Date }) =>
      input.meetingAtBefore?.getTime() === NOW.getTime()
        ? (overrides.meetings ?? [])
        : (overrides.previous ?? []),
    );
  const sendEmail = jest.fn().mockResolvedValue(undefined);
  const create = jest.fn().mockResolvedValue(undefined);
  return {
    deps: {
      orgDirectory: {
        listOrganizations: jest
          .fn()
          .mockResolvedValue([
            { id: "org1", name: "Acme", slug: "acme", logoUrl: null },
          ]),
        getOrganizationById: jest.fn(),
      },
      organizationTeam: {
        listMembersAndPendingInvitations: jest
          .fn()
          .mockResolvedValue({ members, invitations: [] }),
      },
      meetings: { listRecentMeetingsForDashboard },
      notifications: { create },
      sendEmail,
    },
    sendEmail,
    create,
    listRecentMeetingsForDashboard,
  };
}

describe("sendWeeklyManagerDigests", () => {
  it("envoie le bilan aux managers et dépose une notification", async () => {
    const { deps, sendEmail, create } = makeDeps({
      meetings: [meetingRow("a", "s1", 72), meetingRow("b", "s1", 48)],
      previous: [meetingRow("p", "s1", 60)],
    });

    const result = await sendWeeklyManagerDigests(deps as never, {
      now: NOW,
      appBaseUrl: "https://sales-time.test",
    });

    expect(result).toEqual({
      organizationsSeen: 1,
      organizationsWithDigest: 1,
      emailsSent: 1,
      emailsFailed: 0,
    });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const sent = sendEmail.mock.calls[0][0];
    expect(sent.to).toBe("manager@acme.test");
    expect(sent.subject).toContain("2 rendez-vous cette semaine");
    expect(sent.html).toContain(
      "https://sales-time.test/company/rendez-vous/a",
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "m1", href: "/company" }),
    );
  });

  it("interroge les deux fenêtres, celle-ci et la précédente", async () => {
    const { deps, listRecentMeetingsForDashboard } = makeDeps({
      meetings: [meetingRow("a", "s1", 72)],
    });

    await sendWeeklyManagerDigests(deps as never, {
      now: NOW,
      appBaseUrl: "https://sales-time.test",
    });

    const windows = listRecentMeetingsForDashboard.mock.calls.map((c) => [
      c[0].meetingAtSince.toISOString(),
      c[0].meetingAtBefore.toISOString(),
    ]);
    expect(windows).toEqual([
      ["2026-09-21T06:00:00.000Z", "2026-09-28T06:00:00.000Z"],
      ["2026-09-14T06:00:00.000Z", "2026-09-21T06:00:00.000Z"],
    ]);
  });

  it("se tait quand deux semaines sont vides", async () => {
    const { deps, sendEmail } = makeDeps({});

    const result = await sendWeeklyManagerDigests(deps as never, {
      now: NOW,
      appBaseUrl: "https://sales-time.test",
    });

    expect(result.organizationsWithDigest).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  /*
    Un envoi qui échoue est compté, pas propagé : le manager suivant reçoit
    quand même le sien.
  */
  it("compte l'échec d'un envoi sans arrêter la tournée", async () => {
    const { deps, sendEmail } = makeDeps({
      meetings: [meetingRow("a", "s1", 72)],
      members: [
        {
          userId: "m1",
          email: "un@acme.test",
          firstName: null,
          lastName: null,
          role: "ADMIN",
        },
        {
          userId: "m2",
          email: "deux@acme.test",
          firstName: null,
          lastName: null,
          role: "ADMIN",
        },
      ],
    });
    sendEmail
      .mockRejectedValueOnce(new Error("Resend indisponible"))
      .mockResolvedValueOnce(undefined);

    const result = await sendWeeklyManagerDigests(deps as never, {
      now: NOW,
      appBaseUrl: "https://sales-time.test",
    });

    expect(result.emailsSent).toBe(1);
    expect(result.emailsFailed).toBe(1);
  });
});
