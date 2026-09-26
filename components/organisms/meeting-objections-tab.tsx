import { ToneChip, type ChipTone } from "@/components/atoms/tone-chip";
import { Card, CardContent } from "@/components/ui/card";
import { cardTitleClass } from "@/lib/page-typography";
import type {
  ObjectionOutcome,
  ObjectionsAnalysisResult,
} from "@/src/core/domain/objections-result-zod";

const OUTCOME_LABEL: Readonly<Record<ObjectionOutcome, string>> = {
  handled: "traitée",
  partial: "traitée à moitié",
  open: "non traitée",
};

const OUTCOME_TONE: Readonly<Record<ObjectionOutcome, ChipTone>> = {
  handled: "ok",
  partial: "warn",
  open: "bad",
};

/**
 * L'onglet Objections de la fiche, tel que la maquette du 11 septembre le
 * dessine : chaque objection en verbatim, puis la réponse apportée sur le
 * moment, l'effet obtenu, et notre suggestion pour la suite.
 *
 * L'absence d'objection s'affiche comme un fait, pas comme une page vide :
 * un prospect qui n'objecte pas ne s'engage pas toujours, et le commercial
 * doit le lire ici plutôt que de croire le rendez-vous sans accroc.
 */
export function MeetingObjectionsTab({
  objections,
  prospectName,
  pending,
}: {
  objections: ObjectionsAnalysisResult | null;
  prospectName: string;
  pending: boolean;
}) {
  if (!objections) {
    return (
      <Card>
        <CardContent className="space-y-2 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className={cardTitleClass}>Objections</h2>
            {pending ? <ToneChip tone="info">en cours</ToneChip> : null}
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {pending
              ? "Les objections se relèvent pendant l'analyse."
              : "Ce rendez-vous a été analysé avant que les objections ne le soient. Relancez l'analyse pour les obtenir."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (objections.objections.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-2 pt-6">
          <h2 className={cardTitleClass}>Objections</h2>
          <p className="text-muted-foreground max-w-[64ch] text-sm leading-relaxed">
            Aucune objection n&apos;a été relevée dans ce rendez-vous. Ce
            n&apos;est pas forcément bon signe : un prospect qui n&apos;objecte
            pas ne s&apos;engage pas toujours. La question en or de
            l&apos;onglet KISS peut aider à en faire sortir une.
          </p>
        </CardContent>
      </Card>
    );
  }

  const open = objections.objections.filter(
    (o) => o.outcome !== "handled",
  ).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className={cardTitleClass}>
                Les objections et ce qui a été répondu
              </h2>
              {open > 0 ? (
                <ToneChip
                  tone={open === objections.objections.length ? "bad" : "warn"}
                >
                  {open === 1 ? "1 encore ouverte" : `${open} encore ouvertes`}
                </ToneChip>
              ) : (
                <ToneChip tone="ok">toutes traitées</ToneChip>
              )}
            </div>
            <p className="text-muted-foreground mt-1 max-w-[64ch] text-xs leading-relaxed">
              Le prospect a opposé ces points. Voici la réponse apportée sur le
              moment, l&apos;effet qu&apos;elle a produit, et ce que nous
              suggérons pour la suite.
            </p>
          </div>

          {objections.summary.trim() ? (
            <p className="text-[13.5px] leading-[1.65]">{objections.summary}</p>
          ) : null}

          <div className="grid gap-3">
            {objections.objections.map((o, index) => (
              <article
                key={`${index}-${o.objection}`}
                className="border-border bg-card rounded-lg border px-3.5 py-3"
              >
                <blockquote className="border-brand bg-brand-soft/70 rounded-r-lg border-l-[3px] px-3 py-2 dark:bg-brand/10">
                  <p className="text-[13.5px] leading-relaxed italic">
                    « {o.objection} »
                  </p>
                  <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px] not-italic">
                    <span>{o.who}</span>
                    {o.moment ? (
                      <span className="border-border bg-muted/60 rounded border px-1.5 py-px font-mono text-[10.5px] tabular-nums">
                        {o.moment}
                      </span>
                    ) : null}
                    <ToneChip
                      tone={OUTCOME_TONE[o.outcome]}
                      className="ml-auto"
                    >
                      {OUTCOME_LABEL[o.outcome]}
                    </ToneChip>
                  </p>
                </blockquote>
                <p className="mt-2.5 text-[13px] leading-relaxed">
                  <b>Réponse apportée :</b> {o.response}
                </p>
                <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
                  <b>Effet obtenu :</b> {o.effect}
                </p>
                <p className="mt-2.5 rounded-r-lg border-l-[3px] border-emerald-600 bg-emerald-50 px-3 py-2 text-[12.8px] leading-relaxed dark:bg-emerald-950/40">
                  <b>Notre suggestion :</b> {o.suggestion}
                </p>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 pt-6">
          <h2 className={cardTitleClass}>Comment lire cet onglet</h2>
          <p className="text-muted-foreground max-w-[64ch] text-sm leading-relaxed">
            Une objection est une phrase de {prospectName} qui freine, doute ou
            pose une condition. Pour chacune, vous lisez ce qui a été répondu
            sur le moment, l&apos;effet que cela a produit, et une suggestion
            qui contient toujours une question à poser : c&apos;est la question
            qui fait avancer, pas l&apos;argument.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
