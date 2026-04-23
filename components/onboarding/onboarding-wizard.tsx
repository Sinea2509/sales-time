"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  Building2,
  Mail,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  submitOnboardingStep1,
  submitOnboardingStep2,
  submitOnboardingStep3,
  submitOnboardingStep4,
} from "@/app/onboarding/actions";
import {
  ONBOARDING_DEAL_SIZE_OPTIONS,
  ONBOARDING_INDUSTRY_OPTIONS,
  ONBOARDING_SALES_CYCLE_OPTIONS,
  ONBOARDING_TEAM_SIZE_OPTIONS,
} from "@/lib/onboarding-step1-options";
import { normalizePhraseKey } from "@/lib/onboarding-shared-default-phrases";
import { optionsWithLegacy } from "@/lib/options-with-legacy";
import {
  ONBOARDING_INVITE_ROLE_OPTIONS,
  type OnboardingInviteRow,
} from "@/lib/onboarding-invites";
import { OnboardingPhrasePickerSheet } from "@/components/onboarding/onboarding-phrase-picker-sheet";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Contexte", icon: Building2 },
  { id: 2, label: "Coach IA", icon: Sparkles },
  { id: 3, label: "Process", icon: Users },
  { id: 4, label: "Invitations", icon: Mail },
] as const;

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:opacity-50 md:text-sm",
  "dark:bg-input/30",
);

const onboardingSecondaryGreyClass =
  "border border-neutral-200 bg-[#F5F5F5] text-foreground shadow-none hover:bg-[#EBEBEB] dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700";

const violetSoftCtaClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-[#6C4DFF]/10 px-4 py-2.5 text-sm font-medium text-[#6C4DFF] shadow-none hover:bg-[#6C4DFF]/15 sm:w-auto dark:bg-[#6C4DFF]/10 dark:text-[#c4b5fd] dark:hover:bg-[#6C4DFF]/20";

function OnboardingProcessRow({
  value,
  onSave,
  onDelete,
}: {
  value: string;
  onSave: (next: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    const t = draft.trim();
    if (t.length === 0) {
      setDraft(value);
      setEditing(false);
      return;
    }
    onSave(t);
    setEditing(false);
  }

  return (
    <li>
      <div
        className={cn(
          "group border-border flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 transition-colors",
          "hover:border-[#6C4DFF]/20 hover:bg-[#6C4DFF]/5",
        )}
      >
        {editing ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 120))}
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setDraft(value);
                  setEditing(false);
                }
              }}
            />
            <div className="flex shrink-0 gap-1">
              <Button type="button" size="sm" variant="secondary" onClick={commit}>
                Enregistrer
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(value);
                  setEditing(false);
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <>
            <span className="min-w-0 flex-1 text-sm leading-snug">{value}</span>
            <div
              className={cn(
                "flex shrink-0 gap-0.5 transition-opacity",
                "opacity-100 md:opacity-0 md:group-hover:opacity-100",
              )}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                aria-label="Modifier"
                onClick={() => {
                  setDraft(value);
                  setEditing(true);
                }}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                aria-label="Supprimer"
                onClick={onDelete}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

function mergeUniquePhrases(existing: string[], adds: string[]): string[] {
  const keys = new Set(existing.map((t) => normalizePhraseKey(t)));
  const out = [...existing];
  for (const raw of adds) {
    const t = raw.trim();
    if (t.length === 0) continue;
    const k = normalizePhraseKey(t);
    if (keys.has(k)) continue;
    keys.add(k);
    out.push(t);
  }
  return out;
}

export type OnboardingInitialState = {
  currentStep: number;
  companyName: string;
  industrySector: string;
  commercialTeamSize: string;
  averageSalesCycle: string;
  averageDealSize: string;
  companyPitch: string;
  objections: string[];
  keyArguments: string[];
  industryVocabulary: string;
  meetingTypes: string[];
  pipelineStages: string[];
  invites: OnboardingInviteRow[];
  inviteMessage: string;
};

type Props = {
  initial: OnboardingInitialState;
};

export function OnboardingWizard({ initial }: Props) {
  const [step, setStep] = useState(
    Math.min(Math.max(initial.currentStep, 1), 4),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [companyName, setCompanyName] = useState(initial.companyName);
  const [industrySector, setIndustrySector] = useState(initial.industrySector);
  const [commercialTeamSize, setCommercialTeamSize] = useState(
    initial.commercialTeamSize,
  );
  const [averageSalesCycle, setAverageSalesCycle] = useState(
    initial.averageSalesCycle,
  );
  const [averageDealSize, setAverageDealSize] = useState(
    initial.averageDealSize,
  );

  const [companyPitch, setCompanyPitch] = useState(initial.companyPitch);
  const [objections, setObjections] = useState<string[]>(initial.objections);
  const [keyArguments, setKeyArguments] = useState<string[]>(
    initial.keyArguments,
  );
  const [industryVocabulary, setIndustryVocabulary] = useState(
    initial.industryVocabulary,
  );

  const [meetingTypes, setMeetingTypes] = useState<string[]>(
    initial.meetingTypes,
  );
  const [pipelineStages, setPipelineStages] = useState<string[]>(
    initial.pipelineStages,
  );

  const [inviteRows, setInviteRows] = useState<OnboardingInviteRow[]>(
    initial.invites,
  );
  const [inviteMessage, setInviteMessage] = useState(initial.inviteMessage);

  const [objectionPickerOpen, setObjectionPickerOpen] = useState(false);
  const [argumentPickerOpen, setArgumentPickerOpen] = useState(false);

  const [meetingDraftOpen, setMeetingDraftOpen] = useState(false);
  const [pipelineDraftOpen, setPipelineDraftOpen] = useState(false);
  const [draftMeeting, setDraftMeeting] = useState("");
  const [draftStage, setDraftStage] = useState("");

  const pitchLen = companyPitch.length;
  const vocabLen = industryVocabulary.length;
  const stepper = useMemo(
    () =>
      STEPS.map((s) => ({
        ...s,
        active: s.id === step,
        done: s.id < step,
      })),
    [step],
  );

  const industryOptions = useMemo(
    () => optionsWithLegacy(ONBOARDING_INDUSTRY_OPTIONS, industrySector),
    [industrySector],
  );
  const teamSizeOptions = useMemo(
    () => optionsWithLegacy(ONBOARDING_TEAM_SIZE_OPTIONS, commercialTeamSize),
    [commercialTeamSize],
  );
  const cycleOptions = useMemo(
    () => optionsWithLegacy(ONBOARDING_SALES_CYCLE_OPTIONS, averageSalesCycle),
    [averageSalesCycle],
  );
  const dealSizeOptions = useMemo(
    () => optionsWithLegacy(ONBOARDING_DEAL_SIZE_OPTIONS, averageDealSize),
    [averageDealSize],
  );

  function goNext() {
    setError(null);
    startTransition(async () => {
      if (step === 1) {
        const r = await submitOnboardingStep1({
          companyName,
          industrySector: industrySector || null,
          commercialTeamSize: commercialTeamSize || null,
          averageSalesCycle: averageSalesCycle || null,
          averageDealSize: averageDealSize || null,
        });
        if (!r.ok) {
          setError(r.message);
          return;
        }
        setStep(2);
        return;
      }
      if (step === 2) {
        const r = await submitOnboardingStep2({
          companyPitch: companyPitch || null,
          objections,
          keyArguments,
          industryVocabulary: industryVocabulary || null,
        });
        if (!r.ok) {
          setError(r.message);
          return;
        }
        setStep(3);
        return;
      }
      if (step === 3) {
        const r = await submitOnboardingStep3({
          meetingTypes: meetingTypes.filter(Boolean),
          pipelineStages: pipelineStages.filter(Boolean),
        });
        if (!r.ok) {
          setError(r.message);
          return;
        }
        setStep(4);
        return;
      }
      if (step === 4) {
        const invites = inviteRows
          .map((r) => ({
            email: r.email.trim(),
            role: r.role,
          }))
          .filter((r) => r.email.length > 0);
        const r = await submitOnboardingStep4({
          invites,
          inviteMessage: inviteMessage.trim() || null,
        });
        if (!r.ok) {
          setError(r.message);
        }
      }
    });
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="border-border bg-card/40 border-b">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Personnalisons votre coach
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Quatre étapes : contexte, coach IA, processus, invitations.
          </p>

          <ol
            className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-stretch sm:gap-2"
            aria-label="Étapes du parcours"
          >
            {stepper.map(({ id, label, icon: Icon, active, done }) => (
              <li key={id} className="sm:flex-1 sm:min-w-0">
                <div
                  className={cn(
                    "flex h-full flex-col gap-1 rounded-xl border px-3 py-2.5 text-left sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:px-3 sm:py-1.5",
                    active
                      ? "border-[#6C4DFF] bg-[#6C4DFF]/10 text-foreground dark:border-[#6C4DFF]/80 dark:bg-[#6C4DFF]/15"
                      : done
                        ? "border-border bg-muted/60 text-muted-foreground"
                        : "border-border bg-background text-muted-foreground",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                        active
                          ? "bg-[#6C4DFF] text-white"
                          : done
                            ? "bg-muted-foreground/20 text-foreground"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {id}
                    </span>
                    <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                  </span>
                  <span className="text-xs font-medium sm:text-sm">{label}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {error ? (
          <p
            className="bg-destructive/10 text-destructive mb-6 rounded-lg border border-destructive/20 px-4 py-3 text-sm"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contexte</CardTitle>
              <p className="text-muted-foreground text-sm">
                Nom de l’organisation et paramètres commerciaux de base.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l’entreprise</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nom utilisé pour votre espace (ex. Acme SAS)"
                  autoComplete="organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Secteur d’activité</Label>
                <select
                  id="industry"
                  className={selectClassName}
                  value={
                    industryOptions.some((o) => o.value === industrySector)
                      ? industrySector
                      : ""
                  }
                  onChange={(e) => setIndustrySector(e.target.value)}
                >
                  <option value="">Sélectionnez un secteur</option>
                  {industryOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamSize">
                  Taille de l’équipe commerciale
                </Label>
                <select
                  id="teamSize"
                  className={selectClassName}
                  value={
                    teamSizeOptions.some((o) => o.value === commercialTeamSize)
                      ? commercialTeamSize
                      : ""
                  }
                  onChange={(e) => setCommercialTeamSize(e.target.value)}
                >
                  <option value="">Sélectionnez une taille</option>
                  {teamSizeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycle">Cycle de vente moyen</Label>
                <select
                  id="cycle"
                  className={selectClassName}
                  value={
                    cycleOptions.some((o) => o.value === averageSalesCycle)
                      ? averageSalesCycle
                      : ""
                  }
                  onChange={(e) => setAverageSalesCycle(e.target.value)}
                >
                  <option value="">Sélectionnez une durée</option>
                  {cycleOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket">Ticket moyen</Label>
                <select
                  id="ticket"
                  className={selectClassName}
                  value={
                    dealSizeOptions.some((o) => o.value === averageDealSize)
                      ? averageDealSize
                      : ""
                  }
                  onChange={(e) => setAverageDealSize(e.target.value)}
                >
                  <option value="">Sélectionnez une fourchette</option>
                  {dealSizeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coach IA</CardTitle>
              <p className="text-muted-foreground text-sm">
                Pitch, objections, arguments clés et vocabulaire métier.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="pitch">Pitch de l’entreprise</Label>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {pitchLen}/500
                  </span>
                </div>
                <Textarea
                  id="pitch"
                  value={companyPitch}
                  onChange={(e) =>
                    setCompanyPitch(e.target.value.slice(0, 500))
                  }
                  rows={5}
                  placeholder="Texte libre — décrivez ce que vous vendez, à qui, et le problème que vous résolvez."
                />
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-base">Objections principales</Label>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    Ex. « C&apos;est trop cher », « On a déjà un prestataire », «
                    Ce n&apos;est pas le bon moment », « Il faut que j&apos;en
                    parle à mon directeur », « On va réfléchir »
                  </p>
                </div>
                <ul className="space-y-2">
                  {objections.map((o, i) => (
                    <li
                      key={`${i}-${o.slice(0, 12)}`}
                      className="flex gap-2 text-sm"
                    >
                      <span className="border-border flex-1 rounded-md border px-3 py-2">
                        {o}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setObjections((xs) => xs.filter((_, j) => j !== i))
                        }
                      >
                        Retirer
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="secondary"
                  className={cn("w-full sm:w-auto", onboardingSecondaryGreyClass)}
                  onClick={() => setObjectionPickerOpen(true)}
                >
                  + Ajouter une objection
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-base">
                    Arguments clés &amp; différenciateurs
                  </Label>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    Ex. « ROI démontré : nos clients réduisent leurs coûts de 30
                    % en moyenne », « Livraison : livraison sur site en moins de
                    48 h »
                  </p>
                </div>
                <ul className="space-y-2">
                  {keyArguments.map((o, i) => (
                    <li
                      key={`${i}-${o.slice(0, 12)}`}
                      className="flex gap-2 text-sm"
                    >
                      <span className="border-border flex-1 rounded-md border px-3 py-2">
                        {o}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setKeyArguments((xs) => xs.filter((_, j) => j !== i))
                        }
                      >
                        Retirer
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="secondary"
                  className={cn("w-full sm:w-auto", onboardingSecondaryGreyClass)}
                  onClick={() => setArgumentPickerOpen(true)}
                >
                  + Ajouter un argument
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="vocab">Vocabulaire métier</Label>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {vocabLen}/500
                  </span>
                </div>
                <Textarea
                  id="vocab"
                  value={industryVocabulary}
                  onChange={(e) =>
                    setIndustryVocabulary(e.target.value.slice(0, 500))
                  }
                  rows={3}
                  placeholder="RR, churn, TCO, ERP, POC…"
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === 3 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Process</CardTitle>
              <p className="text-muted-foreground text-sm">
                Types de rendez-vous et étapes du pipeline — personnalisables
                pour votre organisation.
              </p>
            </CardHeader>
            <CardContent className="space-y-10">
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Type de RDV</Label>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    Chaque organisation définit ses propres libellés. Par défaut
                    : Qualification, Découverte, Démo, Proposition, Négociation,
                    Closing, Revue de compte.
                  </p>
                </div>
                <ul className="space-y-2">
                  {meetingTypes.map((o, i) => (
                    <OnboardingProcessRow
                      key={`mt-${i}-${o.slice(0, 24)}`}
                      value={o}
                      onSave={(next) =>
                        setMeetingTypes((xs) => {
                          const copy = [...xs];
                          copy[i] = next;
                          return copy;
                        })
                      }
                      onDelete={() =>
                        setMeetingTypes((xs) => xs.filter((_, j) => j !== i))
                      }
                    />
                  ))}
                </ul>
                {meetingDraftOpen ? (
                  <div className="flex flex-col gap-2 rounded-lg border border-dashed border-[#6C4DFF]/30 bg-[#6C4DFF]/5 p-3 sm:flex-row sm:items-center">
                    <Input
                      value={draftMeeting}
                      onChange={(e) => setDraftMeeting(e.target.value)}
                      placeholder="Nouveau type de RDV"
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = draftMeeting.trim();
                          if (!v) return;
                          setMeetingTypes((xs) => [...xs, v]);
                          setDraftMeeting("");
                          setMeetingDraftOpen(false);
                        }
                        if (e.key === "Escape") {
                          setDraftMeeting("");
                          setMeetingDraftOpen(false);
                        }
                      }}
                    />
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className={cn(
                          "border-0 text-white",
                          "bg-[#6C4DFF] hover:bg-[#5a3fd9]",
                        )}
                        onClick={() => {
                          const v = draftMeeting.trim();
                          if (!v) return;
                          setMeetingTypes((xs) => [...xs, v]);
                          setDraftMeeting("");
                          setMeetingDraftOpen(false);
                        }}
                      >
                        Ajouter
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setDraftMeeting("");
                          setMeetingDraftOpen(false);
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  className={violetSoftCtaClass}
                  onClick={() => {
                    setMeetingDraftOpen(true);
                    setDraftMeeting("");
                  }}
                >
                  <Plus className="size-4 shrink-0 text-[#6C4DFF] dark:text-[#c4b5fd]" />
                  + Ajouter un type
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="text-base">Étapes du pipeline</Label>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    Par défaut : Lead entrant, Qualifié, Démo / Proposition,
                    Négociation, Gagné.
                  </p>
                </div>
                <ul className="space-y-2">
                  {pipelineStages.map((o, i) => (
                    <OnboardingProcessRow
                      key={`pl-${i}-${o.slice(0, 24)}`}
                      value={o}
                      onSave={(next) =>
                        setPipelineStages((xs) => {
                          const copy = [...xs];
                          copy[i] = next;
                          return copy;
                        })
                      }
                      onDelete={() =>
                        setPipelineStages((xs) =>
                          xs.filter((_, j) => j !== i),
                        )
                      }
                    />
                  ))}
                </ul>
                {pipelineDraftOpen ? (
                  <div className="flex flex-col gap-2 rounded-lg border border-dashed border-[#6C4DFF]/30 bg-[#6C4DFF]/5 p-3 sm:flex-row sm:items-center">
                    <Input
                      value={draftStage}
                      onChange={(e) => setDraftStage(e.target.value)}
                      placeholder="Nouvelle étape"
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = draftStage.trim();
                          if (!v) return;
                          setPipelineStages((xs) => [...xs, v]);
                          setDraftStage("");
                          setPipelineDraftOpen(false);
                        }
                        if (e.key === "Escape") {
                          setDraftStage("");
                          setPipelineDraftOpen(false);
                        }
                      }}
                    />
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className={cn(
                          "border-0 text-white",
                          "bg-[#6C4DFF] hover:bg-[#5a3fd9]",
                        )}
                        onClick={() => {
                          const v = draftStage.trim();
                          if (!v) return;
                          setPipelineStages((xs) => [...xs, v]);
                          setDraftStage("");
                          setPipelineDraftOpen(false);
                        }}
                      >
                        Ajouter
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setDraftStage("");
                          setPipelineDraftOpen(false);
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  className={violetSoftCtaClass}
                  onClick={() => {
                    setPipelineDraftOpen(true);
                    setDraftStage("");
                  }}
                >
                  <Plus className="size-4 shrink-0 text-[#6C4DFF] dark:text-[#c4b5fd]" />
                  + Ajouter une étape
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === 4 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invitations</CardTitle>
              <p className="text-muted-foreground text-sm">
                Ajoutez des collègues et personnalisez le message envoyé avec
                l’invitation.
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    Invitez votre équipe
                  </h2>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                    E-mail et rôle pour chaque personne.
                  </p>
                </div>
                <ul className="space-y-3">
                  {inviteRows.map((row, i) => (
                    <li
                      key={`inv-row-${i}`}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center"
                    >
                      <Input
                        type="email"
                        className="sm:flex-1"
                        value={row.email}
                        onChange={(e) => {
                          const v = e.target.value;
                          setInviteRows((xs) => {
                            const next = [...xs];
                            next[i] = { ...next[i], email: v };
                            return next;
                          });
                        }}
                        placeholder="collegue@entreprise.com"
                        autoComplete="email"
                      />
                      <select
                        className={cn(selectClassName, "sm:w-44 shrink-0")}
                        value={row.role}
                        onChange={(e) => {
                          const role = e.target.value as OnboardingInviteRow["role"];
                          setInviteRows((xs) => {
                            const next = [...xs];
                            next[i] = { ...next[i], role };
                            return next;
                          });
                        }}
                        aria-label="Rôle"
                      >
                        {ONBOARDING_INVITE_ROLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="ghost"
                  className={violetSoftCtaClass}
                  onClick={() =>
                    setInviteRows((xs) => [
                      ...xs,
                      { email: "", role: "org:member" },
                    ])
                  }
                >
                  <Plus className="size-4 shrink-0 text-[#6C4DFF] dark:text-[#c4b5fd]" />
                  + Ajouter une invitation
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <h2 className="text-base font-semibold tracking-tight">
                  Message d’invitation
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Texte libre : plusieurs lignes possibles.
                </p>
                <Textarea
                  id="inviteMsg"
                  value={inviteMessage}
                  onChange={(e) =>
                    setInviteMessage(e.target.value.slice(0, 2000))
                  }
                  rows={8}
                  placeholder={
                    "Bonjour,\n\nNous utilisons Sales Time pour…"
                  }
                  className="min-h-[10rem] resize-y"
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={step <= 1 || pending}
          >
            Retour
          </Button>
          <Button
            type="button"
            onClick={goNext}
            disabled={pending}
            className={cn(
              "rounded-lg border-0 px-6 font-medium text-white shadow-sm",
              "bg-[#6C4DFF] hover:bg-[#5a3fd9] dark:bg-[#6C4DFF] dark:hover:bg-[#5a3fd9]",
            )}
          >
            {step === 4 ? "Terminer" : "Suivant"}
          </Button>
        </div>

        <p className="text-muted-foreground mt-8 text-center text-sm">
          Vous avez déjà un compte ?{" "}
          <Link
            href="/sign-in"
            className="text-foreground font-medium underline underline-offset-4"
          >
            Connectez-vous
          </Link>
        </p>

        <OnboardingPhrasePickerSheet
          kind="OBJECTION"
          open={objectionPickerOpen}
          onOpenChange={setObjectionPickerOpen}
          title="Objections — collection partagée"
          description="Choisissez des formulations existantes ou créez-en une nouvelle pour tout le monde."
          alreadyChosen={objections}
          onAddToList={(texts) =>
            setObjections((xs) => mergeUniquePhrases(xs, texts))
          }
        />
        <OnboardingPhrasePickerSheet
          kind="ARGUMENT"
          open={argumentPickerOpen}
          onOpenChange={setArgumentPickerOpen}
          title="Arguments — collection partagée"
          description="Choisissez des formulations existantes ou créez-en une nouvelle pour tout le monde."
          alreadyChosen={keyArguments}
          onAddToList={(texts) =>
            setKeyArguments((xs) => mergeUniquePhrases(xs, texts))
          }
        />
      </div>
    </div>
  );
}
