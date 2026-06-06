import { Sparkles } from "lucide-react";
import { SuperAdminKissConsignesEditor } from "@/components/organisms/super-admin-kiss-consignes-editor";
import { PageHeader } from "@/components/molecules/page-header";
import { getApplicationDeps } from "@/lib/application-deps";

export const dynamic = "force-dynamic";

export default async function SuperAdminKissConsignesPage() {
  const deps = getApplicationDeps();
  const initialJson = await deps.globalKissCoachingPrompts.getPrompts();

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <PageHeader
        eyebrow="Super admin"
        icon={Sparkles}
        title="Consignes KISS par quadrant"
        description="Paramètres globaux — distincts des prompts SONCAS / DISC / KISS (modèles d'analyse)."
        backHref="/admin/prompts"
        backLabel="← Prompts d'analyse"
      />

      <SuperAdminKissConsignesEditor initialJson={initialJson} />
    </div>
  );
}
