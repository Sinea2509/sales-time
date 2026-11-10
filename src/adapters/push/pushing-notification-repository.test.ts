import { describe, expect, it, jest } from "@jest/globals";
import { PushingNotificationRepository } from "./pushing-notification-repository";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- jest mock
type JestFn = jest.Mock<any>;

const row = {
  id: "note_1",
  organizationId: "org_1",
  userId: "user_1",
  title: "Analyse terminée",
  body: "Votre rendez-vous avec Claire Morel est prêt.",
  href: "/company/rendez-vous/meet_1",
  readAt: null,
  createdAt: new Date("2026-11-10T10:00:00Z"),
};

function make(tokens: string[], push?: JestFn) {
  const inner = {
    create: jest.fn() as JestFn,
    listUnreadForUser: jest.fn() as JestFn,
    countUnreadForUser: jest.fn() as JestFn,
    markRead: jest.fn() as JestFn,
    markAllRead: jest.fn() as JestFn,
  };
  inner.create.mockResolvedValue(row);
  const devices = {
    register: jest.fn() as JestFn,
    listPushTokensForUser: jest.fn() as JestFn,
    unregister: jest.fn() as JestFn,
    deleteTokens: jest.fn() as JestFn,
  };
  devices.listPushTokensForUser.mockResolvedValue(tokens);
  devices.deleteTokens.mockResolvedValue(undefined);
  const sender = { send: push ?? (jest.fn() as JestFn) };
  if (!push) sender.send.mockResolvedValue({ invalidTokens: [] });
  return {
    repo: new PushingNotificationRepository(inner, devices, sender as never),
    inner,
    devices,
    sender,
  };
}

const input = {
  organizationId: "org_1",
  userId: "user_1",
  title: row.title,
  body: row.body,
  href: row.href,
};

describe("PushingNotificationRepository", () => {
  it("enregistre la notification puis l'envoie sur chaque téléphone du destinataire", async () => {
    const { repo, inner, sender } = make([
      "ExponentPushToken[a]",
      "ExponentPushToken[b]",
    ]);

    await expect(repo.create(input)).resolves.toBe(row);

    expect(inner.create).toHaveBeenCalledWith(input);
    expect(sender.send).toHaveBeenCalledWith([
      {
        to: "ExponentPushToken[a]",
        title: row.title,
        body: row.body,
        data: {
          notificationId: "note_1",
          organizationId: "org_1",
          href: "/company/rendez-vous/meet_1",
        },
      },
      expect.objectContaining({ to: "ExponentPushToken[b]" }),
    ]);
  });

  it("n'appelle pas Expo quand le destinataire n'a pas de téléphone", async () => {
    const { repo, sender } = make([]);

    await repo.create(input);

    expect(sender.send).not.toHaveBeenCalled();
  });

  it("oublie les téléphones qu'Expo dit désinstallés", async () => {
    const push = jest.fn() as JestFn;
    push.mockResolvedValue({ invalidTokens: ["ExponentPushToken[a]"] });
    const { repo, devices } = make(["ExponentPushToken[a]"], push);

    await repo.create(input);

    expect(devices.deleteTokens).toHaveBeenCalledWith(["ExponentPushToken[a]"]);
  });

  it("rend la notification du site même quand l'envoi échoue", async () => {
    const push = jest.fn() as JestFn;
    push.mockRejectedValue(new Error("Expo indisponible"));
    const { repo } = make(["ExponentPushToken[a]"], push);

    await expect(repo.create(input)).resolves.toBe(row);
  });
});
