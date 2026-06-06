import { Button } from "@/components/ui/button";
import { NavLinkButton } from "@/components/molecules/nav-link-button";
import { pageTitleClass } from "@/lib/page-typography";

type AccountActionsPanelProps = {
  email: string;
};

export function AccountActionsPanel({ email }: AccountActionsPanelProps) {
  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div className="space-y-1">
        <h1 className={pageTitleClass}>Compte</h1>
        <p className="text-muted-foreground text-sm">
          Connecté en tant que {email}
        </p>
      </div>
      <ul className="space-y-3 text-sm">
        <li>
          <NavLinkButton
            href="/forgot-password"
            variant="link"
            className="text-primary h-auto p-0 underline-offset-4"
          >
            Réinitialiser le mot de passe
          </NavLinkButton>
        </li>
        <li>
          <form action="/sign-out" method="POST">
            <Button type="submit" variant="outline" size="sm">
              Déconnexion
            </Button>
          </form>
        </li>
      </ul>
    </div>
  );
}
