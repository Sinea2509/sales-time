"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const detail =
    process.env.NODE_ENV === "development"
      ? error.message
      : "Une erreur inattendue s’est produite. Vérifiez les journaux de déploiement (Vercel) et la base de données.";

  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-6 text-center">
        <h1 className="text-xl font-semibold">Impossible de charger la page</h1>
        <p className="text-muted-foreground max-w-md text-sm">{detail}</p>
        {error.digest ? (
          <p className="text-muted-foreground font-mono text-xs">
            digest: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          onClick={() => reset()}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
