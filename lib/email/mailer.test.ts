import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  EmailNotConfiguredError,
  parseEmailFrom,
  sendTransactionalEmail,
} from "./mailer";

const ENV_KEYS = [
  "BREVO_API_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "VERCEL_ENV",
] as const;

describe("sendTransactionalEmail", () => {
  const saved: Record<string, string | undefined> = {};
  const realFetch = global.fetch;

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    global.fetch = realFetch;
  });

  it("lit l'expéditeur avec ou sans nom", () => {
    expect(parseEmailFrom("Sales Time <bonjour@sinea.fr>")).toEqual({
      name: "Sales Time",
      email: "bonjour@sinea.fr",
    });
    expect(parseEmailFrom("bonjour@sinea.fr")).toEqual({
      email: "bonjour@sinea.fr",
    });
  });

  it("envoie par Brevo quand sa clé est là", async () => {
    process.env.BREVO_API_KEY = "cle-de-test";
    process.env.EMAIL_FROM = "Sales Time <bonjour@sinea.fr>";
    const fetchMock = jest
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("{}", { status: 201 }));
    global.fetch = fetchMock;

    await sendTransactionalEmail({
      to: "lisa@exemple.fr",
      subject: "Invitation",
      html: "<p>Bonjour</p>",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect((init?.headers as Record<string, string>)["api-key"]).toBe(
      "cle-de-test",
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      sender: { name: "Sales Time", email: "bonjour@sinea.fr" },
      to: [{ email: "lisa@exemple.fr" }],
      subject: "Invitation",
      htmlContent: "<p>Bonjour</p>",
    });
  });

  it("signale un refus de Brevo au lieu de le taire", async () => {
    process.env.BREVO_API_KEY = "cle-de-test";
    global.fetch = jest
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response('{"message":"sender not valid"}', { status: 400 }),
      );

    await expect(
      sendTransactionalEmail({ to: "a@b.fr", subject: "S", html: "H" }),
    ).rejects.toThrow("Brevo a refusé l'envoi (400)");
  });

  it("refuse en production quand aucun service n'est configuré", async () => {
    process.env.VERCEL_ENV = "production";

    await expect(
      sendTransactionalEmail({ to: "a@b.fr", subject: "S", html: "H" }),
    ).rejects.toBeInstanceOf(EmailNotConfiguredError);
  });

  it("se contente du journal en développement", async () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => {});

    await sendTransactionalEmail({ to: "a@b.fr", subject: "S", html: "H" });

    expect(info).toHaveBeenCalledWith("[email:dev]", {
      to: "a@b.fr",
      subject: "S",
    });
    info.mockRestore();
  });
});
