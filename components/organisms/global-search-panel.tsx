"use client";

import { useState, useTransition } from "react";
import { Link } from "@/i18n/navigation";
import { searchOrgAction } from "@/app/[locale]/company/recherche/actions";
import { Input } from "@/components/ui/input";
import { PrdEmptyState } from "@/components/molecules/prd-empty-state";
import { Search } from "lucide-react";

type SearchResults = {
  meetings: Array<{ id: string; prospectName: string }>;
  contacts: Array<{ id: string; displayName: string }>;
  members: Array<{
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  }>;
};

export function GlobalSearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [pending, startTransition] = useTransition();

  function runSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    startTransition(async () => {
      const res = await searchOrgAction(value);
      if (res.ok) setResults(res.results);
    });
  }

  const empty =
    query.trim().length >= 2 &&
    results &&
    results.meetings.length === 0 &&
    results.contacts.length === 0 &&
    results.members.length === 0;

  return (
    <div className="space-y-6">
      <Input
        placeholder="Rechercher un prospect, RDV ou membre…"
        value={query}
        onChange={(e) => runSearch(e.target.value)}
        aria-busy={pending}
      />

      {empty ? (
        <PrdEmptyState
          icon={Search}
          title="Aucun résultat"
          description="Essayez un autre terme : nom de prospect, entreprise ou email."
        />
      ) : null}

      {results && results.contacts.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Contacts</h2>
          <ul className="divide-y rounded-lg border">
            {results.contacts.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/company/contacts/${c.id}`}
                  className="block px-3 py-2 text-sm hover:bg-muted/50"
                >
                  {c.displayName}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {results && results.meetings.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Rendez-vous</h2>
          <ul className="divide-y rounded-lg border">
            {results.meetings.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/company/rendez-vous/${m.id}`}
                  className="block px-3 py-2 text-sm hover:bg-muted/50"
                >
                  {m.prospectName}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {results && results.members.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Membres</h2>
          <ul className="divide-y rounded-lg border">
            {results.members.map((m) => (
              <li key={m.userId}>
                <Link
                  href={`/company/equipe/${m.userId}`}
                  className="block px-3 py-2 text-sm hover:bg-muted/50"
                >
                  {(m.firstName ?? m.lastName)
                    ? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim()
                    : m.email}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
