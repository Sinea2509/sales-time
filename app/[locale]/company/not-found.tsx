import Link from "next/link";
import { pageTitleClass } from "@/lib/page-typography";

export default function CompanyNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12 text-center">
      <h1 className={pageTitleClass}>Page introuvable</h1>
      <p className="text-muted-foreground text-sm">
        Cet élément n&apos;existe pas ou vous n&apos;y avez pas accès dans
        l&apos;organisation active.
      </p>
      <Link
        href="/company"
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
