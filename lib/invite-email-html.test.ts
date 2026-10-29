import { describe, expect, it } from "@jest/globals";
import {
  buildInvitationEmailHtml,
  coerceStoredInviteMessageToHtml,
  DEFAULT_INVITE_MESSAGE_HTML,
  INVITE_LINK_PLACEHOLDER,
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
    expect(html).toContain("vous choisirez votre mot de passe");
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

describe("la mise en forme du mail d'invitation", () => {
  const html = buildInvitationEmailHtml({
    organizationName: "Sinéa",
    inviteLink: LINK,
    bodyHtml: "<p>Bienvenue dans l'équipe !</p>",
    inviterName: "Thomas Vincent",
  });

  it("annonce l'invitation dans l'aperçu de la boîte de réception", () => {
    expect(html).toContain(
      "Thomas Vincent vous invite à rejoindre Sinéa sur Sales Time.",
    );
  });

  it("met en avant le mot de la personne qui invite, avec ses initiales", () => {
    expect(html).toContain("Le mot de Thomas Vincent");
    expect(html).toContain("Bienvenue dans l'équipe !");
    expect(html).toContain(">TV</div>");
  });

  it("présente les trois étapes qui attendent l'invité", () => {
    expect(html).toContain("Ce qui vous attend");
    expect(html).toContain("Déposez un rendez-vous");
    expect(html).toContain("Recevez votre analyse");
    expect(html).toContain("Progressez");
  });

  it("reste lisible sans le nom de la personne qui invite", () => {
    const anonymous = buildInvitationEmailHtml({
      organizationName: "Sinéa",
      inviteLink: LINK,
      bodyHtml: "",
    });
    expect(anonymous).toContain("Vous êtes invité à rejoindre Sinéa");
    expect(anonymous).toContain("un membre de l’équipe vous a invité");
    expect(anonymous).not.toContain("Le mot de");
  });
});

describe("le message d'invitation par défaut", () => {
  it("vouvoie l'invité", () => {
    expect(DEFAULT_INVITE_MESSAGE_HTML).toContain("votre CRM");
    expect(DEFAULT_INVITE_MESSAGE_HTML).toContain(
      "Inscrivez-vous pour démarrer",
    );
    expect(DEFAULT_INVITE_MESSAGE_HTML).not.toMatch(/\b(t'|tes|te|toi)\b/u);
  });

  it("remplace l'ancien message par défaut, au tutoiement, enregistré tel quel", () => {
    const previous = `<p>Salut, on lance Sales Time dans l'équipe. C'est un coach commercial IA qui va t'aider à gagner du temps sur tes CR, tes mails de suivi, et te donner des feedbacks concrets.</p><p><a href="${INVITE_LINK_PLACEHOLDER}">Inscris-toi pour démarrer</a></p>`;
    expect(coerceStoredInviteMessageToHtml(previous)).toBe(
      DEFAULT_INVITE_MESSAGE_HTML,
    );
  });

  it("présente un assistant qui fait gagner du temps, plus un coach IA", () => {
    expect(DEFAULT_INVITE_MESSAGE_HTML).toContain("assistant commercial");
    expect(DEFAULT_INVITE_MESSAGE_HTML).not.toContain("coach commercial IA");
  });

  it("remplace l'ancien message du coach commercial IA, enregistré tel quel", () => {
    const previous = `<p>Bonjour, nous lançons Sales Time dans l'équipe. C'est un coach commercial IA qui va vous aider à gagner du temps sur vos comptes rendus et vos mails de suivi, et vous donner des retours concrets après chaque rendez-vous.</p><p><a href="${INVITE_LINK_PLACEHOLDER}">Inscrivez-vous pour démarrer</a></p>`;
    expect(coerceStoredInviteMessageToHtml(previous)).toBe(
      DEFAULT_INVITE_MESSAGE_HTML,
    );
  });

  it("garde un message écrit par l'équipe", () => {
    const own = "<p>Salut l'équipe, on y va !</p>";
    expect(coerceStoredInviteMessageToHtml(own)).toBe(own);
  });

  it("titre autrement un message écrit par l'application", () => {
    const html = buildInvitationEmailHtml({
      organizationName: "Sinéa",
      inviteLink: LINK,
      bodyHtml: "<p>Votre compte n'existe pas encore.</p>",
      inviterName: "Thomas Vincent",
      bodyLabel: "À savoir",
    });
    expect(html).toContain(">À savoir</div>");
    expect(html).not.toContain("Le mot de Thomas Vincent");
  });
});
