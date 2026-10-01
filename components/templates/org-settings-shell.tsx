"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { pageTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

/**
 * Les onglets des paramètres, dans l'ordre et avec les mots de la maquette du
 * 11 septembre. Le sous-titre change avec l'onglet : c'est lui qui dit à quoi
 * sert la page, les pages elles-mêmes n'ont plus de titre.
 *
 * « Contexte » n'est pas dans la maquette ; il reste en dernier.
 */
const SETTINGS_TABS = [
  {
    id: "equipe",
    href: "/company/settings/equipe",
    label: "Équipe",
    subtitle: (organization: string) =>
      `L'équipe, le process de vente, le playbook et les consignes du coach. Tout ce qui appartient à ${organization}.`,
  },
  {
    id: "process",
    href: "/company/settings/process",
    label: "Process de vente",
    subtitle: () =>
      "Le process de vente structure les listes de l'application : les types de rendez-vous que vos commerciaux font analyser.",
  },
  {
    id: "playbook",
    href: "/company/settings/playbook",
    label: "Playbook",
    subtitle: () =>
      "Le playbook raconte comment votre organisation vend. Il est injecté dans toutes les analyses.",
  },
  {
    id: "coach-ia",
    href: "/company/settings/coach-ia",
    label: "Coach IA",
    subtitle: () =>
      "Les consignes du coach, méthode par méthode. Le rôle et le ton s'éditent, les échelles, les règles de preuve et la règle anti-invention sont garanties par le produit.",
  },
  {
    id: "email",
    href: "/company/settings/email",
    label: "E-mail",
    subtitle: () =>
      "Le ton des e-mails de suivi générés après chaque rendez-vous.",
  },
  {
    id: "contexte",
    href: "/company/settings/contexte",
    label: "Contexte",
    subtitle: () =>
      "L'identité de votre organisation, son site et son contexte, lus par le coach à chaque analyse.",
  },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OrgSettingsShell({
  organizationName,
  children,
}: {
  /** Le nom de l'organisation, pour le sous-titre de l'onglet Équipe. */
  organizationName?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    SETTINGS_TABS.find((tab) => isActive(pathname, tab.href)) ??
    SETTINGS_TABS[0];
  const organization = organizationName?.trim() || "votre organisation";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className={pageTitleClass}>{"Paramètres de l'organisation"}</h1>
        <p className="text-muted-foreground text-sm">
          {active.subtitle(organization)}
        </p>
      </div>
      <nav
        aria-label="Sections paramètres"
        className="flex flex-wrap gap-0.5 border-b border-border"
      >
        {SETTINGS_TABS.map((tab) => {
          const selected = tab.id === active.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                selected
                  ? "border-brand text-brand-hover dark:text-brand-muted"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
