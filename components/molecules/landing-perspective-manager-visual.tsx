type TeamRow = {
  initials: string;
  color: string;
  name: string;
  subtitle: string;
  score: string;
};

const teamRows: TeamRow[] = [
  {
    initials: "AL",
    color: "#6C4DFF",
    name: "Antoine Lambert",
    subtitle: "Fort en découverte",
    score: "4.2",
  },
  {
    initials: "PC",
    color: "#0284C7",
    name: "Pierre Charpentier",
    subtitle: "À travailler qualification",
    score: "3.8",
  },
  {
    initials: "ML",
    color: "#16A34A",
    name: "Mathilde Leroy",
    subtitle: "Top performer",
    score: "4.5",
  },
  {
    initials: "FA",
    color: "#D97706",
    name: "Fabien Aubry",
    subtitle: "Excellent négo",
    score: "4.8",
  },
];

export function LandingPerspectiveManagerVisual() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-[0_8px_40px_rgba(0,0,0,0.07)]">
      <div className="bg-muted p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-foreground">
            Vue Manager · Équipe
          </p>
          <span className="rounded-[5px] bg-green-600/10 px-2.5 py-0.5 text-[11px] font-semibold text-green-600">
            6 membres
          </span>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-[7px] border border-border bg-card p-2.5">
            <p className="text-[9.5px] text-muted-foreground">TAM cumulé</p>
            <p className="text-base font-bold tracking-tight text-foreground">
              {"21\u00a0h\u00a040"}
            </p>
          </div>
          <div className="rounded-[7px] border border-border bg-card p-2.5">
            <p className="text-[9.5px] text-muted-foreground">RDVs analysés</p>
            <p className="text-base font-bold tracking-tight text-foreground">
              165
            </p>
          </div>
        </div>
        <p className="mb-2 text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
          Mon équipe
        </p>
        <div className="space-y-1.5">
          {teamRows.map((row) => (
            <div
              key={row.name}
              className="flex items-center gap-2 rounded-[7px] border border-border bg-card px-2.5 py-2"
            >
              <span
                className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                style={{ backgroundColor: row.color }}
              >
                {row.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-foreground">
                  {row.name}
                </p>
                <p className="text-[9.5px] text-muted-foreground">
                  {row.subtitle}
                </p>
              </div>
              <p className="text-[11px] font-bold text-foreground">
                {row.score}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
