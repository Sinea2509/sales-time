import Link from "next/link";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Créer un compte
          </h1>
          <p className="text-muted-foreground text-sm">
            Puis complétez votre profil et l&apos;onboarding.
          </p>
        </div>
        <SignUpForm />
        <p className="text-muted-foreground text-center text-sm">
          Déjà inscrit ?{" "}
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
