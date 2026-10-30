"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  Building2,
  Compass,
  ExternalLink,
  Flame,
  Handshake,
  Search,
  ShieldAlert,
  Target,
  UserRound,
} from "lucide-react";
import { researchProspectAction } from "@/app/[locale]/company/preparer/actions";
import { CopyTextButton } from "@/components/molecules/copy-text-button";
import { GoldenQuestionCard } from "@/components/molecules/golden-question-card";
import {
  LikelyObjectionsList,
  PrepareCard,
  PrepareChips,
  PrepareList,
} from "@/components/molecules/prepare-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import { Textarea } from "@/components/ui/textarea";
import {
  discStyleLabel,
  prospectDynamicLabel,
  prospectResearchAsText,
  type ProspectResearch,
} from "@/src/core/domain/prospect-research";

type Result = {
  research: ProspectResearch;
  sources: string[];
  companyName: string;
  personName: string | null;
};

function messageErreur(code: string): string {
  if (code === "VALIDATION") {
    return "Indiquez au moins le nom de l'entreprise, et des adresses web complètes (https://…).";
  }
  if (code === "AI_NOT_CONFIGURED") {
    return "La recherche n'est pas disponible sur cet environnement.";
  }
  return "La préparation n'a pas pu être faite cette fois. Réessayez dans un instant.";
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-2 text-sm leading-relaxed">
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="min-w-0">{value ?? <Missing />}</span>
    </div>
  );
}

function Missing() {
  return <span className="text-muted-foreground italic">Non trouvé</span>;
}

function ResearchCard({ result }: { result: Result }) {
  const { research: r, sources } = result;
  const text = prospectResearchAsText(r, {
    companyName: result.companyName,
    personName: result.personName,
    sources,
  });
  return (
    <article className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Vos munitions pour {result.companyName}
          </h2>
          <p className="text-muted-foreground text-sm">
            Tirées du web, avec leurs sources en bas. Ce qui n&apos;a pas été
            trouvé est marqué « Non trouvé » : rien n&apos;est inventé.
          </p>
        </div>
        <CopyTextButton text={text} label="Copier la fiche" variant="default" />
      </div>

      {r.attackPlan.goldenQuestions.length ? (
        <GoldenQuestionCard
          title={
            r.attackPlan.goldenQuestions.length > 1
              ? "Vos questions en or"
              : "Votre question en or"
          }
          questions={r.attackPlan.goldenQuestions}
        />
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <PrepareCard icon={Building2} title="Santé et contexte">
          <Field label="Le vrai métier" value={r.company.realJob} />
          <Field label="Siège" value={r.company.headquarters} />
          <Field label="Effectif" value={r.company.headcount} />
          <Field label="Secteur" value={r.company.sector} />
          <Field
            label="Dynamique"
            value={
              prospectDynamicLabel(r.company.dynamic) ? (
                <>
                  <b>{prospectDynamicLabel(r.company.dynamic)}</b>
                  {r.company.dynamicWhy ? ` · ${r.company.dynamicWhy}` : ""}
                </>
              ) : null
            }
          />
          <Field
            label="Outils"
            value={r.company.tools.length ? r.company.tools.join(", ") : null}
          />
        </PrepareCard>

        <PrepareCard icon={UserRound} tone="coral" title="Le décideur">
          <Field
            label="DISC estimé"
            value={
              discStyleLabel(r.decisionMaker.discStyle) ? (
                <>
                  <b>{discStyleLabel(r.decisionMaker.discStyle)}</b>
                  {r.decisionMaker.discWhy
                    ? ` · ${r.decisionMaker.discWhy}`
                    : ""}
                </>
              ) : null
            }
          />
          <Field label="Ice breaker" value={r.decisionMaker.iceBreaker} />
        </PrepareCard>

        <PrepareCard icon={Flame} tone="amber" title="La douleur">
          <Field
            label="Ils recrutent"
            value={
              r.pain.hiring.length ? (
                <PrepareList items={r.pain.hiring} />
              ) : null
            }
          />
          <Field
            label="Leur culture"
            value={
              r.pain.cultureKeywords.length ? (
                <PrepareChips items={r.pain.cultureKeywords} />
              ) : null
            }
          />
        </PrepareCard>

        <PrepareCard icon={Target} tone="teal" title="Le plan d'attaque">
          <Field
            label="Offre à prioriser"
            value={
              r.attackPlan.priorityOffer ? (
                <>
                  <b>{r.attackPlan.priorityOffer}</b>
                  {r.attackPlan.offerWhy ? ` · ${r.attackPlan.offerWhy}` : ""}
                </>
              ) : null
            }
          />
        </PrepareCard>

        {r.attackPlan.likelyObjections.length ? (
          <PrepareCard
            icon={ShieldAlert}
            tone="coral"
            title="Objections à anticiper"
          >
            <LikelyObjectionsList items={r.attackPlan.likelyObjections} />
          </PrepareCard>
        ) : null}

        {r.clientReferences.length ? (
          <PrepareCard
            icon={Handshake}
            tone="teal"
            title="Clients similaires à citer"
          >
            <ul className="space-y-1.5">
              {r.clientReferences.map((c) => (
                <li key={c.client}>
                  <b>{c.client}</b> · {c.theme}
                  <span className="text-muted-foreground"> · {c.link}</span>
                </li>
              ))}
            </ul>
          </PrepareCard>
        ) : null}

        {r.unknowns.length ? (
          <PrepareCard
            icon={Compass}
            title="À découvrir pendant le rendez-vous"
          >
            <PrepareList items={r.unknowns} />
          </PrepareCard>
        ) : null}
      </div>

      {sources.length ? (
        <details className="text-sm">
          <summary className="text-muted-foreground font-medium">
            Sources consultées ({sources.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {sources.map((s) => (
              <li key={s}>
                <a
                  href={s}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand inline-flex items-center gap-1 break-all hover:underline"
                >
                  {s}
                  <ExternalLink className="size-3 shrink-0" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </article>
  );
}

/**
 * Préparer un premier rendez-vous avec un prospect dont on sait peu de
 * choses : le site, l'interlocuteur et son profil, puis une recherche web
 * rangée en munitions (méthode Seed de Sinéa, 28 octobre 2026).
 */
export function ProspectResearchForm({
  pipelineStageOptions,
}: {
  pipelineStageOptions: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="py-2">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              const fd = new FormData(e.currentTarget);
              const get = (k: string) => String(fd.get(k) ?? "");
              const input = {
                companyName: get("companyName"),
                website: get("website"),
                personName: get("personName"),
                personRole: get("personRole"),
                linkedinUrl: get("linkedinUrl"),
                profileText: get("profileText"),
                targetStage: get("targetStage"),
              };
              startTransition(async () => {
                try {
                  const res = await researchProspectAction(input);
                  if (!res.ok) {
                    setError(messageErreur(res.error));
                    return;
                  }
                  setResult({
                    research: res.research,
                    sources: res.sources,
                    companyName: input.companyName.trim(),
                    personName: input.personName.trim() || null,
                  });
                } catch {
                  setError(messageErreur("FAILED"));
                }
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Entreprise</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  required
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://www.entreprise.fr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personName">Interlocuteur</Label>
                <Input
                  id="personName"
                  name="personName"
                  placeholder="Prénom Nom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personRole">Fonction</Label>
                <Input
                  id="personRole"
                  name="personRole"
                  placeholder="Ex. DRH, directeur commercial"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="linkedinUrl">Profil LinkedIn</Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  placeholder="https://www.linkedin.com/in/…"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="profileText">
                  Texte du profil LinkedIn (facultatif)
                </Label>
                <Textarea
                  id="profileText"
                  name="profileText"
                  rows={4}
                  placeholder="LinkedIn ne se laisse pas lire automatiquement : collez ici le résumé, l'expérience et une ou deux publications récentes pour un DISC et un ice breaker précis."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetStageWeb">Type de rendez-vous</Label>
                <select
                  id="targetStageWeb"
                  name="targetStage"
                  className={nativeSelectClassName}
                  defaultValue={pipelineStageOptions[0] ?? ""}
                  required
                >
                  {pipelineStageOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={pending}
              className="bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              <Search className="size-4" aria-hidden />
              {pending
                ? "Recherche sur le web… (15 à 30 secondes)"
                : "Préparer le rendez-vous"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result ? <ResearchCard result={result} /> : null}
    </div>
  );
}
