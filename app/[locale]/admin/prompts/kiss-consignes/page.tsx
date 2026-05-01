import { Sparkles } from "lucide-react";
import { SuperAdminKissConsignesEditor } from "@/components/organisms/super-admin-kiss-consignes-editor";
import { Link } from "@/i18n/navigation";
import { getApplicationDeps } from "@/lib/application-deps";
import { pageTitleClass } from "@/lib/page-typography";

export const dynamic = "force-dynamic";

export default async function SuperAdminKissConsignesPage() {
  const deps = getApplicationDeps();
  const initialJson = await deps.globalKissCoachingPrompts.getPrompts();

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="bg-primary/8 ring-border/60 flex size-12 shrink-0 items-center justify-center rounded-xl ring-1">
            <Sparkles className="text-primary size-6" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Super admin
            </p>
            <h1 className={pageTitleClass}>Consignes KISS par quadrant</h1>
            <p className="text-muted-foreground text-sm">
              Paramètres globaux — distincts des prompts SONCAS / DISC / KISS
              (modèles d’analyse).
            </p>
          </div>
        </div>
        <Link
          href="/admin/prompts"
          className="border-input bg-background ring-offset-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          ← Prompts d’analyse
        </Link>
      </div>

      <SuperAdminKissConsignesEditor initialJson={initialJson} />
    </div>
  );
}
