export type DemoOrganizationPromptVersions = {
  soncas: string;
  disc: string;
  kiss: string;
};

export type DemoOrganizationResult = {
  organizationId: string;
  slug: string;
  name: string;
  password: string;
  managerEmail: string;
  salesEmails: string[];
  memberCount: number;
  meetingCount: number;
};

/**
 * L'organisation de démonstration, créée par la plateforme quand elle manque.
 *
 * Le contenu (comptes, contacts, rendez-vous, analyses) est écrit par le même
 * code que le script de seed : une démo montrée à un prospect ressemble
 * toujours à celle que le développeur a sous les yeux. Une démo déjà remplie
 * n'est jamais touchée : la remise à neuf reste une opération de développeur,
 * par le script de seed.
 */
export interface DemoTenantPort {
  ensureDemoOrganization(input: {
    promptVersions: DemoOrganizationPromptVersions;
  }): Promise<DemoOrganizationResult>;
}
