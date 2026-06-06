const kissThemes = [
  { label: "Qualification budget", tag: "STOP · 38%", color: "#DC2626", pct: 38 },
  { label: "Écoute active", tag: "KEEP · 72%", color: "#16A34A", pct: 72 },
  { label: "Closing next step", tag: "IMPROVE · 55%", color: "#0284C7", pct: 55 },
] as const;

export function LandingPerspectiveDirectionVisual() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-[0_8px_40px_rgba(0,0,0,0.07)]">
      <div className="bg-zinc-50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-zinc-950">Rapports · Entreprise</p>
          <span className="rounded-[5px] bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
            30 jours
          </span>
        </div>
        <div className="mb-2.5 grid grid-cols-3 gap-2">
          {[
            { label: "TAM cumulé", value: "21h40" },
            { label: "RDVs coachés", value: "165" },
            { label: "TUC moyen", value: "68%" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-[7px] border border-zinc-200 bg-white p-2.5"
            >
              <p className="text-[9.5px] text-zinc-500">{kpi.label}</p>
              <p className="text-base font-bold tracking-tight text-zinc-950">{kpi.value}</p>
            </div>
          ))}
        </div>
        <p className="mb-2.5 text-[10.5px] font-semibold tracking-wide text-zinc-500 uppercase">
          Thématiques KISS
        </p>
        <div className="space-y-2">
          {kissThemes.map((theme) => (
            <div key={theme.label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] text-zinc-600">{theme.label}</span>
                <span className="text-[11px] font-bold" style={{ color: theme.color }}>
                  {theme.tag}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-sm bg-zinc-200">
                <div
                  className="h-full rounded-sm"
                  style={{ width: `${theme.pct}%`, backgroundColor: theme.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
