import { describe, expect, it } from "@jest/globals";
import {
  buildInvitationEmailHtml,
  invitationEmailSubject,
} from "./invite-email-html";

const LINK = "https://sales-time.example/invitations/abc";

describe("le mail d'invitation", () => {
  it("dit qui invite dans l'objet, ou l'organisation seule", () => {
    expect(
      invitationEmailSubject({
        organizationName: "Sinéa",
        inviterName: "Thomas Vincent",
      }),
    ).toBe("Thomas Vincent vous invite sur Sales Time · Sinéa");
    expect(invitationEmailSubject({ organizationName: "Sinéa" })).toBe(
      "Invitation à rejoindre Sinéa sur Sales Time",
    );
  });

  it("annonce que l'on choisit son mot de passe, la date limite et le lien en clair", () => {
    const html = buildInvitationEmailHtml({
      organizationName: "Sinéa",
      inviteLink: LINK,
      bodyHtml: "",
      inviterName: "Thomas Vincent",
      expiresAt: new Date("2026-11-03T10:00:00Z"),
    });
    expect(html).toContain("<strong>Thomas Vincent</strong> vous invite");
    expect(html).toContain("Créer mon compte");
    expect(html).toContain("Vous choisirez votre mot de passe");
    expect(html).toContain("3 novembre 2026");
    // Le lien est aussi donné en texte, hors du bouton.
    expect(html.split(LINK).length - 1).toBeGreaterThanOrEqual(3);
  });

  it("échappe le nom de l'organisation et de la personne qui invite", () => {
    const html = buildInvitationEmailHtml({
      organizationName: "A & B <test>",
      inviteLink: LINK,
      bodyHtml: "",
      inviterName: "<script>",
    });
    expect(html).toContain("A &amp; B &lt;test&gt;");
    expect(html).not.toContain("<script>");
  });
});
