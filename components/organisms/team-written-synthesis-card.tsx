import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import type { TeamWrittenSynthesis } from "@/src/core/domain/team-written-synthesis";

/**
 * La synthèse de l'équipe, écrite par le produit depuis les analyses de la
 * période : quatre paragraphes en gras, puis les chiffres qu'ils citent,
 * repris en liste pour qu'un manager puisse les relire sans les chercher.
 */
export function TeamWrittenSynthesisCard({
  synthesis,
}: {
  synthesis: TeamWrittenSynthesis | null;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div>
          <h2 className={cardTitleClass}>Synthèse de l&apos;équipe</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Ce que les analyses de la période disent quand on les lit ensemble,
            avec les chiffres qui le montrent.
          </p>
        </div>
        {!synthesis ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            La synthèse s&apos;écrit dès que deux commerciaux ont des
            rendez-vous analysés sur la période.
          </p>
        ) : (
          <>
            <div className="space-y-2.5">
              {synthesis.paragraphs.map((p) => (
                <p key={p.title} className="text-[14px] leading-[1.7]">
                  <b>{p.title}</b> {p.text}
                </p>
              ))}
            </div>
            {synthesis.figures.length > 0 ? (
              <dl className="border-border mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 border-t pt-3 text-[13px]">
                {synthesis.figures.map((f) => (
                  <div key={f.label} className="contents">
                    <dt className="text-muted-foreground">{f.label}</dt>
                    <dd className="text-right font-semibold tabular-nums">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
