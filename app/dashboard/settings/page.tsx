import Link from "next/link";
import { Building2, ClipboardList, Sparkles, Users } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { prisma } from "@/lib/prisma";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    href: "/dashboard/settings/contexte",
    title: "Contexte",
    description:
      "Nom de l’entreprise, secteur, taille d’équipe, cycle et ticket moyen.",
    icon: Building2,
  },
  {
    href: "/dashboard/settings/coach-ia",
    title: "Coach IA",
    description: "Pitch, objections, arguments et vocabulaire métier.",
    icon: Sparkles,
  },
  {
    href: "/dashboard/settings/process",
    title: "Process",
    description: "Types de rendez-vous et étapes du pipeline commerciaux.",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/settings/equipe",
    title: "Équipe & accès",
    description: "Rôles, invitations et accès à l’organisation.",
    icon: Users,
  },
] as const;

export default async function OrganizationSettingsOverviewPage() {
  const superAdminOrgCookie = await readSuperAdminOrgCookie();
  const actor = await getCurrentActorContext(makeApplicationDeps(), {
    superAdminActiveClerkOrgId: superAdminOrgCookie,
  });
  const orgId =
    actor.kind === "authenticated" ? actor.activeTenantClerkOrgId : null;

  const row =
    orgId != null
      ? await prisma.organizationSettings.findUnique({
          where: { clerkOrgId: orgId },
        })
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
            <Card className="h-full transition-colors hover:border-[#6C4DFF]/25">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <div className="bg-[#6C4DFF]/10 text-[#6C4DFF] dark:text-[#c4b5fd] flex size-10 shrink-0 items-center justify-center rounded-lg">
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
                      "h-auto px-0 text-[#6C4DFF] dark:text-[#c4b5fd]",
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
