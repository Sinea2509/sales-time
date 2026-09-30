import { DiscWheel, DISC_NAMES } from "@/components/molecules/disc-wheel";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import type { DiscAnalysisResult } from "@/src/core/domain/analysis-result-zod";
import { DISC_HEX } from "@/src/core/domain/seller-affinity-from-meetings";

const KEYS = ["D", "I", "S", "C"] as const;

export function MeetingDiscTab({
  disc,
  prospectName,
  pending,
}: {
  disc: DiscAnalysisResult | null;
  prospectName: string;
  pending: boolean;
}) {
  if (!disc) {
    return (
      <Card>
        <CardContent className="pt-6">
          <h2 className={cardTitleClass}>DISC</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {pending
              ? "Analyse DISC en cours…"
              : "Profil DISC indisponible pour ce rendez-vous."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const ordered = [...KEYS].sort((a, b) => disc.scores[b] - disc.scores[a]);
  const dominant = disc.dominant;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div>
            <h2 className={cardTitleClass}>
              DISC, le style de communication de {prospectName}
            </h2>
            <p className="text-muted-foreground mt-1 max-w-[64ch] text-xs leading-relaxed">
              Le DISC décrit une manière de communiquer observée pendant
              l&apos;échange. Il ne décrit pas une personnalité, et il ne dit
              rien de la valeur de la personne. Les quatre styles sont notés
              indépendamment, sur 100.
            </p>
          </div>

          <div className="grid items-center gap-6 md:grid-cols-[minmax(0,336px)_minmax(0,1fr)]">
            <div>
              <DiscWheel scores={disc.scores} dominant={dominant} />
              <p className="mt-3.5 text-center text-sm leading-relaxed">
                Style principal détecté :<br />
                <b style={{ color: DISC_HEX[dominant] }}>
                  {dominant}, {DISC_NAMES[dominant]}
                </b>
                , à {disc.scores[dominant]} sur 100.
              </p>
            </div>
            <div>
              <p className="text-[13.5px] leading-[1.65]">{disc.summary}</p>
              <p className="text-muted-foreground mt-2.5 text-xs leading-relaxed">
                Cette lecture est une tendance observée sur ce seul rendez-vous,
                à partir de la façon dont la personne s&apos;exprime. Ce
                n&apos;est pas un test DISC, et elle peut changer au rendez-vous
                suivant.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {ordered.map((k) => (
              <div
                key={k}
                className="grid grid-cols-[16px_minmax(120px,1.4fr)_minmax(90px,1fr)_70px] items-center gap-3 rounded-lg border px-3.5 py-3"
                style={{
                  borderColor: k === dominant ? DISC_HEX[k] : "var(--border)",
                }}
              >
                <span
                  className="size-[13px] rounded-[3px]"
                  style={{ background: DISC_HEX[k] }}
                  aria-hidden
                />
                <span className="text-[13.4px] font-semibold">
                  {k}, {DISC_NAMES[k]}
                  {k === dominant ? (
                    <span
                      className="ml-1.5 rounded-full border bg-card px-2 py-0.5 text-[11px] font-semibold"
                      style={{ borderColor: DISC_HEX[k], color: DISC_HEX[k] }}
                    >
                      principal
                    </span>
                  ) : null}
                </span>
                <span className="block h-[11px] overflow-hidden rounded-[6px] bg-border">
                  <span
                    className="block h-full rounded-[6px]"
                    style={{
                      width: `${disc.scores[k]}%`,
                      background: DISC_HEX[k],
                    }}
                  />
                </span>
                <span className="text-right text-sm font-bold tabular-nums">
                  {disc.scores[k]}
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    / 100
                  </span>
                </span>
              </div>
            ))}
          </div>

          {disc.evidence.length > 0 ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs">
                Ce qui a été entendu, {disc.evidence.length}{" "}
                {disc.evidence.length > 1 ? "passages" : "passage"}
              </p>
              {disc.evidence.map((quote) => (
                <blockquote
                  key={quote}
                  className="rounded-r-lg border-l-[3px] bg-muted/40 px-3.5 py-2.5 text-[12.8px] leading-relaxed italic"
                  style={{ borderLeftColor: DISC_HEX[dominant] }}
                >
                  « {quote} »
                </blockquote>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {disc.actionableAdvice ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="space-y-2 pt-6">
              <h2 className={cardTitleClass}>Comment lui parler</h2>
              <p className="text-[13.5px] leading-[1.65]">
                {disc.actionableAdvice.howToTalk}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 pt-6">
              <h2 className={cardTitleClass}>
                Ce qu&apos;il vaut mieux éviter
              </h2>
              <p className="text-[13.5px] leading-[1.65]">
                {disc.actionableAdvice.whatToAvoid}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
