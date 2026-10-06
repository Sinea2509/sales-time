import type { AnalysisScoringOverview } from "@/lib/analysis-scoring-overview";

/**
 * La fiche d'une analyse : son rôle, ce qu'elle produit, comment elle note,
 * et ce qu'elle laisse aux autres. Affichée au-dessus de la consigne, ouverte,
 * pour que le système de notation se lise sans chercher.
 */
export function AnalysisScoringOverviewCard({
  overview,
}: {
  overview: AnalysisScoringOverview;
}) {
  return (
    <section
      aria-label="Rôle et système de notation"
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <h3 className="text-[14px] font-semibold">Rôle et système de notation</h3>
      <p className="mt-1 text-[13px] leading-relaxed">{overview.role}</p>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-[11.5px] font-bold tracking-[.06em] uppercase">
            Ce qu&apos;elle produit
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12.8px] leading-relaxed">
            {overview.produces.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-muted-foreground text-[11.5px] font-bold tracking-[.06em] uppercase">
            Ce qu&apos;elle ne fait pas
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12.8px] leading-relaxed">
            {overview.notHere.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      {overview.scoring.length > 0 ? (
        <div className="mt-4">
          <p className="text-muted-foreground text-[11.5px] font-bold tracking-[.06em] uppercase">
            Comment elle note
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12.8px] leading-relaxed">
            {overview.scoring.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {overview.tables.map((table) => (
        <div key={table.caption} className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <caption className="text-muted-foreground mb-1.5 text-left text-[11.5px] font-bold tracking-[.06em] uppercase">
              {table.caption}
            </caption>
            <thead>
              <tr>
                {table.head.map((cell) => (
                  <th
                    key={cell}
                    scope="col"
                    className="border-b border-border px-2 py-1.5 text-left font-semibold"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row.join("|")} className="align-top">
                  {row.map((cell, i) => (
                    <td
                      key={`${i}-${cell}`}
                      className="border-b border-dashed border-border px-2 py-1.5 tabular-nums"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}
