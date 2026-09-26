/**
 * Ce que la plateforme sait faire selon les variables d'environnement, dit
 * en conséquences pour l'utilisateur plutôt qu'en noms de variables.
 *
 * Un e-mail qui ne part pas ne laisse aucune trace visible : l'invitation
 * semble envoyée, le collègue n'a rien reçu. La page Santé doit le dire avant
 * qu'un client ne l'apprenne à ses dépens.
 */
export type PlatformConfigCheck = {
  key: string;
  label: string;
  ok: boolean;
  /** Ce qui marche, ou ce qui manque, en une phrase. */
  detail: string;
  /** Faux pour ce qui n'empêche pas le produit de fonctionner. */
  critical: boolean;
};

type EnvLike = Readonly<Record<string, string | undefined>>;

function isSet(env: EnvLike, key: string): boolean {
  return Boolean(env[key]?.trim());
}

export function platformConfigChecks(env: EnvLike): PlatformConfigCheck[] {
  const resend = isSet(env, "RESEND_API_KEY");
  const emailFrom = isSet(env, "EMAIL_FROM");

  return [
    {
      key: "ai",
      label: "Analyse IA",
      ok: isSet(env, "AI_GATEWAY_API_KEY"),
      detail: isSet(env, "AI_GATEWAY_API_KEY")
        ? "Clé AI Gateway présente : les rendez-vous sont analysés."
        : "AI_GATEWAY_API_KEY manquante : aucune analyse ne peut démarrer.",
      critical: true,
    },
    {
      key: "email",
      label: "E-mails transactionnels",
      ok: resend,
      detail: resend
        ? emailFrom
          ? `Envoi par Resend depuis ${env.EMAIL_FROM?.trim()}.`
          : "Envoi par Resend, mais EMAIL_FROM manque : l'expéditeur sera onboarding@resend.dev."
        : "RESEND_API_KEY manquante : invitations d'équipe, mot de passe oublié et « analyse prête » ne partent pas.",
      critical: true,
    },
    {
      key: "cron",
      label: "Tâches planifiées",
      ok: isSet(env, "CRON_SECRET"),
      detail: isSet(env, "CRON_SECRET")
        ? "CRON_SECRET présent : le rattrapage des analyses et la purge RGPD tournent."
        : "CRON_SECRET manquant : Vercel ne peut pas appeler les tâches planifiées.",
      critical: true,
    },
    {
      key: "blob",
      label: "Fichiers (logos, transcripts)",
      ok: isSet(env, "BLOB_READ_WRITE_TOKEN"),
      detail: isSet(env, "BLOB_READ_WRITE_TOKEN")
        ? "Stockage Blob configuré."
        : "BLOB_READ_WRITE_TOKEN manquant : le téléversement de fichiers échoue.",
      critical: false,
    },
    {
      key: "cookie",
      label: "Élévation super admin",
      ok: isSet(env, "SUPER_ADMIN_ORG_COOKIE_SECRET"),
      detail: isSet(env, "SUPER_ADMIN_ORG_COOKIE_SECRET")
        ? "Secret de signature présent."
        : "SUPER_ADMIN_ORG_COOKIE_SECRET manquant : « Opérer dans une organisation » est refusé en production.",
      critical: false,
    },
    {
      key: "baseUrl",
      label: "Adresse publique",
      ok: isSet(env, "APP_BASE_URL"),
      detail: isSet(env, "APP_BASE_URL")
        ? `Les liens des e-mails pointent vers ${env.APP_BASE_URL?.trim()}.`
        : "APP_BASE_URL manquante : les liens des e-mails pointeraient vers localhost.",
      critical: false,
    },
  ];
}
