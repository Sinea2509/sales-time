import Link from "next/link";
import { redirect } from "next/navigation";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const deps = makeApplicationDeps();
  const principal = await deps.auth.getAuthenticatedPrincipal();
  if (!principal) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compte</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Connecté en tant que{" "}
          <span className="text-foreground font-medium">{principal.email}</span>
        </p>
      </div>
      <ul className="space-y-3 text-sm">
        <li>
          <Link
            href="/forgot-password"
            className="text-primary underline-offset-4 hover:underline"
          >
            Réinitialiser le mot de passe
          </Link>
        </li>
        <li>
          <Link
            href="/sign-out"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Déconnexion
          </Link>
        </li>
      </ul>
    </div>
  );
}
