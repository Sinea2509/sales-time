import { platformConfigChecks } from "./platform-config-status";

describe("platformConfigChecks", () => {
  it("signale les e-mails comme manquants sans clé Resend", () => {
    const checks = platformConfigChecks({});
    const email = checks.find((c) => c.key === "email");

    expect(email?.ok).toBe(false);
    expect(email?.critical).toBe(true);
    expect(email?.detail).toContain("invitations");
  });

  it("avertit quand Resend est là mais pas l'expéditeur", () => {
    const checks = platformConfigChecks({ RESEND_API_KEY: "re_x" });
    const email = checks.find((c) => c.key === "email");

    expect(email?.ok).toBe(true);
    expect(email?.detail).toContain("onboarding@resend.dev");
  });

  it("nomme l'expéditeur quand tout est configuré", () => {
    const checks = platformConfigChecks({
      RESEND_API_KEY: "re_x",
      EMAIL_FROM: "Sales Time <no-reply@example.fr>",
    });
    const email = checks.find((c) => c.key === "email");

    expect(email?.detail).toContain("no-reply@example.fr");
  });

  it("traite une valeur vide comme absente", () => {
    const checks = platformConfigChecks({ AI_GATEWAY_API_KEY: "   " });
    expect(checks.find((c) => c.key === "ai")?.ok).toBe(false);
  });
});
