"use client";

import { useEffect } from "react";
import Link from "next/link";
import { pageTitleClass } from "@/lib/page-typography";

export default function MeetingDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Meeting detail page error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  const detail =
    process.env.NODE_ENV === "development"
      ? error.message
      : "Impossible d'afficher cette fiche rendez-vous. Réessayez ou contactez le support si le problème persiste.";

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12 text-center">
      <h1 className={pageTitleClass}>Fiche RDV indisponible</h1>
      <p className="text-muted-foreground text-sm">{detail}</p>
      {error.digest ? (
        <p className="text-muted-foreground font-mono text-xs">
          digest: {error.digest}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          onClick={() => reset()}
        >
          Réessayer
        </button>
        <Link
          href="/company/rendez-vous"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover"
        >
          Retour aux rendez-vous
        </Link>
      </div>
    </div>
  );
}
