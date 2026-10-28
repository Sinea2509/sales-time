"use client";

import { useState, useTransition, type ReactNode } from "react";
import { ExternalLink, Search } from "lucide-react";
import { researchProspectAction } from "@/app/[locale]/company/preparer/actions";
import { CopyTextButton } from "@/components/molecules/copy-text-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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

function Section({
  num,
  title,
  accent,
  children,
}: {
  num: number;
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "space-y-2.5 rounded-xl border border-l-4 border-border bg-card p-4 dark:border-zinc-800",
        accent,
      )}
    >
      <h3 className="text-[15px] font-semibold">
        <span className="text-muted-foreground mr-1.5 tabular-nums">
          {num}.
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
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

      <div className="grid gap-3 lg:grid-cols-2">
        <Section num={1} title="Santé et contexte" accent="border-l-[#6C4DFF]">
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
        </Section>

        <Section num={2} title="Le décideur" accent="border-l-[#FF7A6B]">
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
        </Section>

        <Section num={3} title="La douleur" accent="border-l-[#FFB547]">
          <Field
            label="Ils recrutent"
            value={
              r.pain.hiring.length ? (
                <ul className="list-disc space-y-1 pl-4">
                  {r.pain.hiring.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              ) : null
            }
          />
          <Field
            label="Leur culture"
            value={
              r.pain.cultureKeywords.length ? (
                <span className="flex flex-wrap gap-1.5">
                  {r.pain.cultureKeywords.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-[#FFB547]/15 px-2 py-0.5 text-xs font-semibold"
                    >
                      {k}
                    </span>
                  ))}
                </span>
              ) : null
            }
          />
        </Section>

        <Section num={4} title="Le plan d'attaque" accent="border-l-[#33D1B5]">
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
          {r.attackPlan.goldenQuestions.length ? (
            <ol className="space-y-2 pt-1">
              {r.attackPlan.goldenQuestions.map((q, i) => (
                <li
                  key={q}
                  className="rounded-lg bg-[#33D1B5]/10 px-3 py-2 text-sm leading-relaxed"
                >
                  <span className="mr-1.5 font-semibold">Question {i + 1}</span>
                  {q}
                </li>
              ))}
            </ol>
          ) : null}
        </Section>
      </div>

      {r.clientReferences.length ? (
        <section className="space-y-2 rounded-xl border border-border bg-card p-4 dark:border-zinc-800">
          <h3 className="text-[15px] font-semibold">
            Clients similaires à citer
          </h3>
          <ul className="space-y-1.5 text-sm leading-relaxed">
            {r.clientReferences.map((c) => (
              <li key={c.client}>
                <b>{c.client}</b> · {c.theme}
                <span className="text-muted-foreground"> · {c.link}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {r.unknowns.length ? (
        <p className="text-muted-foreground text-sm">
          <b className="text-foreground">
            À découvrir pendant le rendez-vous :
          </b>{" "}
          {r.unknowns.join(" ; ")}
        </p>
      ) : null}

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
      <form
        className="space-y-4 rounded-xl border p-4"
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
            <Input id="personName" name="personName" placeholder="Prénom Nom" />
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

      {result ? <ResearchCard result={result} /> : null}
    </div>
  );
}
