"use client";

import { useEffect } from "react";
import Link from "next/link";
import { pageTitleClass } from "@/lib/page-typography";

/**
 * L'erreur d'une page de l'application, affichée dans sa charte.
 *
 * Sans cette limite, une erreur dans la mise en page d'un espace (un menu de
 * l'en-tête, par exemple) remontait jusqu'à la page de dernier recours, sans
 * styles et écrite pour un développeur.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur de page", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h1 className={pageTitleClass}>
        Cette page n&apos;a pas pu s&apos;afficher
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Une erreur inattendue s&apos;est produite. Réessayez dans un instant. Si
        elle revient, notez le code ci-dessous et signalez-la avec le bouton
        Feedback, ou à votre administrateur.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <p className="text-muted-foreground font-mono text-xs">
          {error.message}
        </p>
      ) : null}
      {error.digest ? (
        <p className="text-muted-foreground font-mono text-xs">
          Code de l&apos;erreur : {error.digest}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          className="bg-brand text-brand-foreground hover:bg-brand-hover rounded-lg px-4 py-2 text-sm font-medium"
          onClick={() => reset()}
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="border-border hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Revenir à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
