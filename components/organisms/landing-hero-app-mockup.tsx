import {
  BarChart3,
  CheckSquare,
  ChevronRight,
  Crown,
} from "lucide-react";
import { KISS_COACHING_SCORE_LABEL, SALES_SCORE_LABEL } from "@/lib/sales-score-color";

type MockRow = {
  initials: string;
  color: string;
  name: string;
  company: string;
  stage: string;
  stageBg: string;
  stageColor: string;
  score: string;
  scoreBg: string;
  scoreColor: string;
};

const mockRows: MockRow[] = [
  {
    initials: "AL",
    color: "#6C4DFF",
    name: "Antoine Lambert",
    company: "TechVision",
    stage: "Découverte",
    stageBg: "rgba(2,132,199,0.15)",
    stageColor: "#60B8E8",
    score: "64",
    scoreBg: "rgba(227,146,25,0.15)",
    scoreColor: "#E39219",
  },
  {
    initials: "PC",
    color: "#0284C7",
    name: "Pierre Charpentier",
    company: "InnovaGroup",
    stage: "Proposition",
    stageBg: "rgba(108,77,255,0.15)",
    stageColor: "#BDB0FF",
    score: "56",
    scoreBg: "rgba(227,146,25,0.15)",
    scoreColor: "#E39219",
  },
  {
    initials: "ML",
    color: "#16A34A",
    name: "Mathilde Leroy",
    company: "DigitechSA",
    stage: "Découverte",
    stageBg: "rgba(2,132,199,0.15)",
    stageColor: "#60B8E8",
    score: "48",
    scoreBg: "rgba(220,38,38,0.15)",
    scoreColor: "#F87171",
  },
  {
    initials: "FA",
    color: "#E39219",
    name: "Fabien Aubry",
    company: "BuildPro",
    stage: "Négociation",
    stageBg: "rgba(22,163,74,0.15)",
    stageColor: "#4ADE80",
    score: "98",
    scoreBg: "rgba(22,163,74,0.15)",
    scoreColor: "#4ADE80",
  },
];

const sidebarItems = [
  { label: "Tableau de bord", icon: BarChart3, active: true },
  { label: "Mes rendez-vous", icon: CheckSquare, active: false },
  { label: "Analyse", icon: Crown, active: false },
] as const;

const kissCoachingItems = [
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

export function LandingHeroAppMockup() {
  return (
    <div
      className="relative z-[2] w-full max-w-[1000px] overflow-hidden rounded-t-[14px] border border-b-0 border-white/10 shadow-[0_-12px_60px_rgba(108,77,255,0.15),0_40px_80px_rgba(0,0,0,0.5)]"
      role="img"
      aria-label="Aperçu du tableau de bord Sales Time avec coaching KISS"
    >
      <div className="flex h-[38px] shrink-0 items-center gap-2.5 border-b border-white/7 bg-[#0D0D16] px-3.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#FF5F57]" />
          <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="size-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="mx-auto flex h-[22px] max-w-[260px] flex-1 items-center justify-center rounded-[5px] bg-white/5 text-[10.5px] text-white/22">
          app.sales-time.io / tableau de bord
        </div>
      </div>
      <div className="relative flex h-[400px]">
        <aside className="flex w-[188px] shrink-0 flex-col gap-0.5 border-r border-white/5 bg-[#0A0A12] px-2.5 py-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 px-2 py-1.5">
            <span className="size-[22px] shrink-0 rounded-md bg-brand" aria-hidden />
            <span className="text-xs font-bold text-white/75">Sales Time</span>
          </div>
          {sidebarItems.map((item) => (
            <div
              key={item.label}
              className={
                item.active
                  ? "flex items-center gap-1.5 rounded-md bg-white/7 px-2 py-1.5 text-[11.5px] text-white/80"
                  : "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11.5px] text-white/32"
              }
            >
              <item.icon className="size-3.25 opacity-60" strokeWidth={2} />
              {item.label}
            </div>
          ))}
          <div className="flex-1" />
          <div className="mt-2 rounded-lg border border-brand/20 bg-brand/10 p-2.5">
            <p className="mb-1 text-[9px] text-white/28">Essai gratuit · 5 restantes</p>
            <div className="mb-1 h-[3px] overflow-hidden rounded-sm bg-white/10">
              <div className="h-full w-1/2 rounded-sm bg-brand" />
            </div>
            <p className="text-[9px] font-semibold text-brand/80">Voir les plans →</p>
          </div>
        </aside>
        <div className="flex flex-1 flex-col gap-3.5 overflow-hidden bg-[#0E0E18] p-4.5">
          <div className="mb-0.5 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-white/75">
              Thomas Vidal · Tableau de bord
            </span>
            <span className="rounded-[5px] border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/30">
              30 jours
            </span>
          </div>
          <div className="flex gap-2.5">
            {[
              { label: "TAM CUMULÉ", value: "3\u00a0h\u00a040", trend: "+12 min" },
              { label: "RENDEZ-VOUS ANALYSÉS", value: "24", trend: "+2" },
              { label: "TUC OPTIMISÉ", value: "70%", trend: "+5%" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 rounded-[9px] border border-white/7 bg-white/4 px-3.5 py-3"
              >
                <p className="text-[9.5px] font-medium text-white/28">{stat.label}</p>
                <p className="text-[22px] font-bold tracking-tight text-white/88">{stat.value}</p>
                <p className="mt-0.5 text-[9.5px] text-[#4ADE80]">{stat.trend}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-1 flex-col overflow-hidden rounded-[9px] border border-white/6 bg-white/3">
            <div className="grid grid-cols-[1.8fr_1fr_70px_50px] border-b border-white/5 px-3 py-2">
              {["Prospect", "Étape", SALES_SCORE_LABEL, ""].map((col) => (
                <span
                  key={col || "actions"}
                  className="text-[9.5px] font-semibold tracking-wide text-white/22 uppercase"
                >
                  {col}
                </span>
              ))}
            </div>
            {mockRows.map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-[1.8fr_1fr_70px_50px] items-center border-b border-white/4 px-3 py-2 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: row.color }}
                  >
                    {row.initials}
                  </span>
                  <div>
                    <p className="text-[11px] font-medium text-white/72">{row.name}</p>
                    <p className="text-[9.5px] text-white/24">{row.company}</p>
                  </div>
                </div>
                <span
                  className="w-fit rounded px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ backgroundColor: row.stageBg, color: row.stageColor }}
                >
                  {row.stage}
                </span>
                <span
                  className="flex size-[34px] items-center justify-center rounded-[5px] text-[10px] font-bold"
                  style={{ backgroundColor: row.scoreBg, color: row.scoreColor }}
                >
                  {row.score}
                </span>
                <span className="flex size-7 items-center justify-center rounded bg-brand/18">
                  <ChevronRight className="size-2.5 text-brand/80" strokeWidth={2.5} />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="pointer-events-none absolute right-4 bottom-4 z-10 w-[min(100%,320px)] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-[0_12px_48px_rgba(0,0,0,0.35)]"
          aria-hidden
        >
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[12px] font-semibold text-zinc-950">
                Analyse RDV · Antoine Lambert
              </p>
              <span className="shrink-0 rounded-[5px] bg-brand/10 px-2 py-0.5 text-[10.5px] font-semibold text-brand">
                {KISS_COACHING_SCORE_LABEL} 7/10
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {kissCoachingItems.map((item) => (
                <div
                  key={item.key}
                  className="rounded-[7px] border p-2"
                  style={{ backgroundColor: item.bg, borderColor: item.border }}
                >
                  <p className="mb-0.5 text-[9px] font-bold" style={{ color: item.color }}>
                    {item.key}
                  </p>
                  <p className="text-[10px] leading-snug text-zinc-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
