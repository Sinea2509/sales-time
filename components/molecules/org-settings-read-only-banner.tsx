export function OrgSettingsReadOnlyBanner() {
  return (
    <p
      className="text-muted-foreground rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/60"
      role="status"
    >
      Lecture seule : seul un manager peut modifier ces paramètres
      d&apos;organisation.
    </p>
  );
}
