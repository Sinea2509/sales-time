import { LandingKissLegend } from "@/components/molecules/landing-kiss-legend";
import { KISS_COACHING_SCORE_LABEL } from "@/lib/sales-score-color";

export function LandingPerspectiveKissVisual() {
  const kissItems = [
    {
      key: "KEEP",
      color: "#16A34A",
      bg: "rgba(22,163,74,0.06)",
      border: "rgba(22,163,74,0.15)",
      text: "Très bonne écoute active. Excellentes questions de découverte.",
    },
    {
      key: "IMPROVE",
      color: "#0284C7",
      bg: "rgba(2,132,199,0.06)",
      border: "rgba(2,132,199,0.15)",
      text: "Challenger davantage sur le budget avant la proposition.",
    },
    {
      key: "START",
      color: "#6C4DFF",
      bg: "rgba(108,77,255,0.06)",
      border: "rgba(108,77,255,0.2)",
      text: "Créer de l'urgence via des benchmarks sectoriels.",
    },
    {
      key: "STOP",
      color: "#DC2626",
      bg: "rgba(220,38,38,0.06)",
      border: "rgba(220,38,38,0.15)",
      text: "Promettre un POC gratuit sans accord de principe.",
    },
  ] as const;

  const discBars = [
    { label: "D", pct: 65, color: "#DC2626" },
    { label: "I", pct: 30, color: "#D97706" },
    { label: "S", pct: 35, color: "#16A34A" },
    { label: "C", pct: 20, color: "#0284C7" },
  ] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-[0_8px_40px_rgba(0,0,0,0.07)]">
      <div className="bg-muted p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-foreground">
            Analyse RDV · Antoine Lambert
          </p>
          <span className="rounded-[5px] bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
            {KISS_COACHING_SCORE_LABEL} 7/10
          </span>
        </div>
        <LandingKissLegend className="mb-3" />
        <div className="mb-4 grid grid-cols-2 gap-2">
          {kissItems.map((item) => (
            <div
              key={item.key}
              className="rounded-[7px] border p-2.5"
              style={{ backgroundColor: item.bg, borderColor: item.border }}
            >
              <p
                className="mb-1 text-[9.5px] font-bold"
                style={{ color: item.color }}
              >
                {item.key}
              </p>
              <p className="text-[11px] leading-snug text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </div>
        <p className="mb-2 text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
          Profil DISC
        </p>
        <div className="space-y-1.5">
          {discBars.map((bar) => (
            <div key={bar.label} className="flex items-center gap-2">
              <span
                className="w-4 text-[10px] font-bold"
                style={{ color: bar.color }}
              >
                {bar.label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-muted">
                <div
                  className="h-full rounded-sm"
                  style={{ width: `${bar.pct}%`, backgroundColor: bar.color }}
                />
              </div>
              <span className="w-7 text-right text-[10px] text-muted-foreground">
                {bar.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
