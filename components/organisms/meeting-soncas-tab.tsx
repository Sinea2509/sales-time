import { ToneChip } from "@/components/atoms/tone-chip";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import type { SoncasAnalysisResult } from "@/src/core/domain/analysis-result-zod";
import { PROFILE_SCORE_UNPROVEN_MAX } from "@/src/core/domain/profile-score-scale";

type SoncasKey = keyof SoncasAnalysisResult["drivers"];

const SONCAS_NAMES: Readonly<Record<SoncasKey, string>> = {
  securite: "Sécurité",
  orgueil: "Orgueil",
  nouveaute: "Nouveauté",
  confort: "Confort",
  argent: "Argent",
  sympathie: "Sympathie",
};

const KEYS = Object.keys(SONCAS_NAMES) as SoncasKey[];

export function MeetingSoncasTab({
  soncas,
  prospectName,
  pending,
}: {
  soncas: SoncasAnalysisResult | null;
  prospectName: string;
  pending: boolean;
}) {
  if (!soncas) {
    return (
      <Card>
        <CardContent className="pt-6">
          <h2 className={cardTitleClass}>SONCAS</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {pending
              ? "Analyse SONCAS en cours…"
              : "Profil SONCAS indisponible pour ce rendez-vous."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const ordered = [...KEYS].sort(
    (a, b) => soncas.drivers[b].score - soncas.drivers[a].score,
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className={cardTitleClass}>
              SONCAS, les motivations d&apos;achat de {prospectName}
            </h2>
            <p className="text-muted-foreground mt-1 max-w-[64ch] text-xs leading-relaxed">
              Le levier principal entendu est{" "}
              <b>{SONCAS_NAMES[soncas.dominant]}</b>. Chaque levier est noté sur
              100 d&apos;après ce qui s&apos;entend dans l&apos;échange, et
              au-dessus de {PROFILE_SCORE_UNPROVEN_MAX} il cite les mots du
              prospect.
            </p>
          </div>
          <p className="text-[13.5px] leading-[1.65]">{soncas.summary}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {ordered.map((k) => {
              const lever = soncas.drivers[k];
              const dominant = k === soncas.dominant;
              const proofs = lever.evidence.filter((e) => e.trim());
              return (
                <div
                  key={k}
                  className={cn(
                    "rounded-lg border px-3.5 py-3",
                    dominant
                      ? "border-brand/30 bg-brand-soft dark:bg-brand/10"
                      : "border-border bg-card",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-[13.5px]">
                      {SONCAS_NAMES[k]}
                      {dominant ? (
                        <ToneChip tone="brand" className="ml-1.5">
                          principal
                        </ToneChip>
                      ) : null}
                    </b>
                    <span className="text-[12.5px] tabular-nums">
                      <b className="text-[15px]">{lever.score}</b>{" "}
                      <span className="text-muted-foreground">sur 100</span>
                    </span>
                  </div>
                  <span className="my-2 block h-[9px] overflow-hidden rounded-full bg-border">
                    <span
                      className="bg-brand block h-full rounded-full"
                      style={{ width: `${lever.score}%` }}
                    />
                  </span>
                  {proofs.length > 0 ? (
                    proofs.map((quote) => (
                      <blockquote
                        key={quote}
                        className="border-brand bg-brand-soft/70 mt-2 rounded-r-lg border-l-[3px] px-3 py-2 text-[12.8px] leading-relaxed italic dark:bg-brand/10"
                      >
                        « {quote} »
                      </blockquote>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Aucune preuve entendue : le score ne peut pas dépasser{" "}
                      {PROFILE_SCORE_UNPROVEN_MAX}, c&apos;est la règle
                      appliquée par le produit après l&apos;analyse.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {soncas.actionableAdvice ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="space-y-2 pt-6">
              <h2 className={cardTitleClass}>Comment lui parler</h2>
              <p className="text-[13.5px] leading-[1.65]">
                {soncas.actionableAdvice.howToTalk}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 pt-6">
              <h2 className={cardTitleClass}>
                Ce qu&apos;il vaut mieux éviter
              </h2>
              <p className="text-[13.5px] leading-[1.65]">
                {soncas.actionableAdvice.whatToAvoid}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
