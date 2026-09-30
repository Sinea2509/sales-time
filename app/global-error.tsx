"use client";

import { useEffect } from "react";
import Link from "next/link";
import "./globals.css";

/**
 * La page de dernier recours, quand même la mise en page de l'application n'a
 * pas pu s'afficher.
 *
 * Elle parle à l'utilisateur, pas au développeur : elle demandait de
 * « vérifier les journaux de déploiement (Vercel) et la base de données ». Le
 * détail technique part dans la console, et le code de l'erreur reste affiché
 * pour qu'on puisse la retrouver dans les journaux.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur non rattrapée", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="fr">
      <body
        className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <h1 className="text-xl font-semibold tracking-tight">
          Cette page n&apos;a pas pu s&apos;afficher
        </h1>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          Une erreur inattendue s&apos;est produite. Réessayez dans un instant.
          Si elle revient, notez le code ci-dessous et signalez-la à votre
          administrateur.
        </p>
        {process.env.NODE_ENV === "development" ? (
          <p className="text-muted-foreground max-w-md font-mono text-xs">
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
      </body>
    </html>
  );
}
