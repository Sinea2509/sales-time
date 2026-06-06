import { SignInForm } from "@/components/organisms/sign-in-form";
import { NavLinkButton } from "@/components/molecules/nav-link-button";
import { pageTitleClass } from "@/lib/page-typography";

type SignInPageShellProps = {
  next?: string;
};

export function SignInPageShell({ next }: SignInPageShellProps) {
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
          <NavLinkButton
            href="/forgot-password"
            variant="link"
            className="text-muted-foreground hover:text-foreground h-auto p-0 underline-offset-4"
          >
            Mot de passe oublié ?
          </NavLinkButton>
          <p className="text-muted-foreground">
            Pas encore de compte ?{" "}
            <NavLinkButton
              href="/sign-up"
              variant="link"
              className="h-auto p-0"
            >
              Créer un compte
            </NavLinkButton>
          </p>
        </div>
      </div>
    </div>
  );
}
