import Link from "next/link";
import { SignInForm } from "@/components/organisms/sign-in-form";
import { buttonVariants } from "@/components/ui/button";
import { pageTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";

type Search = { next?: string | string[] };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const nextRaw = sp.next;
  const next = Array.isArray(nextRaw) ? nextRaw[0] : nextRaw;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className={pageTitleClass}>Connexion</h1>
          <p className="text-muted-foreground text-sm">
            Accédez à votre espace Sales Time.
          </p>
        </div>
        <SignInForm next={next} />
        <div className="flex flex-col gap-2 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
          <p className="text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
