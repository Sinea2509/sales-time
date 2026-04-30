import Link from "next/link";
import { Building2, ClipboardList, Sparkles, Users } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getApplicationDeps } from "@/lib/application-deps";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    href: "/company/settings/contexte",
    title: "Contexte",
    description:
      "Logo, nom de l’entreprise, secteur, taille d’équipe, cycle et ticket moyen.",
    icon: Building2,
  },
  {
    href: "/company/settings/coach-ia",
    title: "Coach IA",
    description: "Pitch, objections, arguments et vocabulaire métier.",
    icon: Sparkles,
  },
  {
    href: "/company/settings/process",
    title: "Process",
    description: "Types de rendez-vous et étapes du pipeline commerciaux.",
    icon: ClipboardList,
  },
  {
    href: "/company/settings/equipe",
    title: "Équipe & accès",
    description: "Rôles, invitations et accès à l’organisation.",
    icon: Users,
  },
] as const;

export default async function OrganizationSettingsOverviewPage() {
  const superAdminOrgCookie = await readSuperAdminOrgCookie();
  const deps = getApplicationDeps();
  const actor = await getCurrentActorContext({ auth: deps.auth }, {
    superAdminElevatedOrganizationId: superAdminOrgCookie,
  });
  const orgId =
    actor.kind === "authenticated" ? actor.activeOrganizationId : null;

  const row =
    orgId != null
      ? await deps.organizationSettings.findByOrganizationId(orgId)
      : null;

  const configured = row != null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Paramètres de l’organisation
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          Configurez le contexte commercial, le coach IA et le process partagés
          par votre espace. Seuls les administrateurs de l’organisation peuvent
          modifier ces réglages.
        </p>
        <p className="text-muted-foreground mt-2 font-mono text-xs">
          Organisation : {orgId ?? "—"}
        </p>
        {configured ? (
          <p className="text-muted-foreground mt-2 text-xs">
            Une configuration a déjà été enregistrée pour cette organisation.
          </p>
        ) : (
          <p className="text-muted-foreground mt-2 text-xs">
            Aucune configuration enregistrée pour l’instant — remplissez les
            sections ci-dessous.
          </p>
        )}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ href, title, description, icon: Icon }) => (
          <li key={href}>
            <Card className="h-full transition-colors hover:border-brand/25">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <div className="bg-brand/10 text-brand dark:text-brand-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="text-base">{title}</CardTitle>
                  <CardDescription className="text-sm leading-snug">
                    {description}
                  </CardDescription>
                  <Link
                    href={href}
                    className={cn(
                      buttonVariants({ variant: "link", size: "sm" }),
                      "h-auto px-0 text-brand dark:text-brand-muted",
                    )}
                  >
                    Ouvrir
                  </Link>
                </div>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
