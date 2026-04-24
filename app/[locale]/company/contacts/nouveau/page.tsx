import Link from "next/link";
import { redirect } from "next/navigation";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { ContactCreateForm } from "@/components/organisms/contact-create-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewContactPage() {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/company/contacts"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-2 -ml-2")}
        >
          ← Retour aux contacts
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau contact</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Ajoutez un prospect ou un interlocuteur à votre base.
        </p>
      </div>
      <ContactCreateForm />
    </div>
  );
}
