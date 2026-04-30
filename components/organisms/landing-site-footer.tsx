import Link from "next/link";

export function LandingSiteFooter() {
  return (
    <footer className="border-border mt-auto border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-sm">
          <p className="text-foreground font-semibold">Sales Time</p>
          <p className="mt-2 text-sm leading-relaxed">
            Coach commercial IA et directeur commercial virtuel : transcript,
            analyse, coaching et suivi — pour les équipes B2B qui veulent gagner
            du temps utile commercial.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-sm sm:items-end">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/sign-in"
              className="text-foreground/90 hover:text-brand font-medium underline-offset-4 hover:underline"
            >
              Connexion
            </Link>
            <Link
              href="/sign-up"
              className="text-foreground/90 hover:text-brand font-medium underline-offset-4 hover:underline"
            >
              Inscription
            </Link>
            <Link
              href="/company/plan"
              className="text-foreground/90 hover:text-brand font-medium underline-offset-4 hover:underline"
            >
              Plan produit
            </Link>
          </div>
          <p className="text-muted-foreground text-xs">
            Données hébergées de façon sécurisée. Rôles commercial, manager et
            admin.
          </p>
        </div>
      </div>
      <div className="text-muted-foreground border-border border-t py-4 text-center text-xs">
        © {new Date().getFullYear()} Sales Time. Tous droits réservés.
      </div>
    </footer>
  );
}
