import { describe, expect, it, jest } from "@jest/globals";
import { ExpoPushSender } from "./expo-push-sender";

const message = (to: string) => ({
  to,
  title: "Analyse terminée",
  body: "Prêt.",
  data: { href: "/company/rendez-vous/m1" },
});

function fakeFetch(body: unknown, ok = true) {
  return jest
    .fn<typeof fetch>()
    .mockResolvedValue({ ok, json: async () => body } as Response);
}

describe("ExpoPushSender", () => {
  it("rend les jetons qu'Expo dit désinstallés", async () => {
    const f = fakeFetch({
      data: [
        { status: "ok", id: "t1" },
        {
          status: "error",
          message: "gone",
          details: { error: "DeviceNotRegistered" },
        },
      ],
    });
    const sender = new ExpoPushSender(f, undefined);

    const out = await sender.send([
      message("ExponentPushToken[a]"),
      message("ExponentPushToken[b]"),
    ]);

    expect(out.invalidTokens).toEqual(["ExponentPushToken[b]"]);
    const init = f.mock.calls[0]?.[1];
    expect(init?.headers).not.toHaveProperty("Authorization");
    expect(JSON.parse(String(init?.body))[0]).toMatchObject({
      to: "ExponentPushToken[a]",
      sound: "default",
    });
  });

  it("présente la clé d'accès Expo quand elle est configurée", async () => {
    const f = fakeFetch({ data: [{ status: "ok", id: "t1" }] });

    await new ExpoPushSender(f, "cle").send([message("ExponentPushToken[a]")]);

    expect(f.mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer cle",
    });
  });

  it("découpe par lots de cent", async () => {
    const f = fakeFetch({ data: [] });
    const many = Array.from({ length: 150 }, (_, i) =>
      message(`ExponentPushToken[${i}]`),
    );

    await new ExpoPushSender(f, undefined).send(many);

    expect(f).toHaveBeenCalledTimes(2);
  });

  it("n'échoue pas quand Expo est injoignable", async () => {
    const f = jest.fn<typeof fetch>().mockRejectedValue(new Error("réseau"));

    await expect(
      new ExpoPushSender(f, undefined).send([message("ExponentPushToken[a]")]),
    ).resolves.toEqual({ invalidTokens: [] });
  });
});
