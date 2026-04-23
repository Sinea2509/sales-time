import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function OrganizationSettingsEquipePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Équipe & accès
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          Les membres, rôles (admin / membre) et invitations d’organisation sont
          gérés dans Clerk. Utilisez le sélecteur d’organisation dans la barre
          latérale ou le tableau de bord Clerk pour inviter des personnes et
          ajuster les droits.
        </p>
      </div>
      <div className="bg-muted/40 rounded-xl border p-4 text-sm leading-relaxed">
        <p>
          Sales Time applique les rôles Clerk&nbsp;: les administrateurs
          d’organisation voient les vues «&nbsp;équipe&nbsp;» et accèdent à ces
          paramètres ; les membres conservent un périmètre individuel.
        </p>
      </div>
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
