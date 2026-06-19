"use client";

import { Fragment, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  submitOnboardingStep1,
  submitOnboardingStep2,
  submitOnboardingStep3,
  submitOnboardingStep4,
} from "@/app/[locale]/onboarding/actions";
import {
  ONBOARDING_DEAL_SIZE_OPTIONS,
  ONBOARDING_INDUSTRY_OPTIONS,
  ONBOARDING_SALES_CYCLE_OPTIONS,
  ONBOARDING_TEAM_SIZE_OPTIONS,
} from "@/lib/onboarding-step1-options";
import { coachListAddSecondaryButtonClass } from "@/lib/coach-list-add-button-class";
import { mergeUniqueCoachPhrases } from "@/lib/coach-shared-phrases-merge";
import { optionsWithLegacy } from "@/lib/options-with-legacy";
import type { OnboardingInviteRow } from "@/lib/onboarding-invites";
import { CoachSharedPhrasePickerSheet } from "@/components/organisms/coach-shared-phrase-picker-sheet";
import { TeamInviteRowsField } from "@/components/molecules/team-invite-rows-field";
import { InviteMessageRichEditor } from "@/components/molecules/invite-message-rich-editor";
import { SignupFlowIllustration } from "@/components/molecules/signup-flow-illustration";
import {
  ProcessStringListSection,
  processItemsFromStrings,
  trimProcessStringListValues,
  type ProcessStringListItem,
  type ProcessStringListSectionHandle,
} from "@/components/molecules/process-string-list-section";
import { cn } from "@/lib/utils";
import { nativeSelectClassName } from "@/components/ui/native-select-class";

const STEPS = [
  {
    id: 1,
    label: "Contexte",
    description: "",
  },
  {
    id: 2,
    label: "Coach IA",
    description: "",
  },
  {
    id: 3,
    label: "Process",
    description: "",
  },
  {
    id: 4,
    label: "Invitations",
    description: "",
  },
] as const;

function OnboardingStepRail({ step }: { step: number }) {
  const meta = STEPS[step - 1];
  return (
    <nav
      className="mb-8 flex w-full flex-col items-center"
      aria-label="Étapes du parcours"
    >
      <div className="mx-auto mb-5 flex w-full max-w-lg items-start justify-center gap-0.5 sm:gap-1">
        {STEPS.map((s, index) => {
          const isDone = step > s.id;
          const isCurrent = step === s.id;
          const isDoneOrCurrent = isDone || isCurrent;
          return (
            <Fragment key={s.id}>
              <div className="flex w-[4.25rem] shrink-0 flex-col items-center gap-1.5 sm:w-20">
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Étape ${s.id} — ${s.label}`}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg text-sm font-semibold tabular-nums transition-colors",
                    isDoneOrCurrent &&
                      "bg-brand text-white shadow-sm shadow-brand/30",
                    !isDoneOrCurrent &&
                      "bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400",
                  )}
                >
                  {s.id}
                </span>
                <span
                  className={cn(
                    "text-center text-xs font-normal leading-snug sm:text-sm",
                    isDoneOrCurrent && "text-brand dark:text-brand-muted",
                    !isDoneOrCurrent && "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mx-0.5 mt-[1.125rem] h-0.5 min-w-[0.5rem] flex-1 rounded-full sm:mx-1",
                    step > s.id
                      ? "bg-brand"
                      : "bg-neutral-200 dark:bg-neutral-700",
                  )}
                  aria-hidden
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
      {meta.description ? (
        <div className="mx-auto w-full max-w-lg text-center">
          <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
            {meta.description}
          </p>
        </div>
      ) : null}
    </nav>
  );
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

  const [meetingTypeItems, setMeetingTypeItems] = useState<
    ProcessStringListItem[]
  >(() => processItemsFromStrings("mt", initial.meetingTypes));
  const [pipelineStageItems, setPipelineStageItems] = useState<
    ProcessStringListItem[]
  >(() => processItemsFromStrings("pl", initial.pipelineStages));

  const meetingTypesRef = useRef<ProcessStringListSectionHandle>(null);
  const pipelineStagesRef = useRef<ProcessStringListSectionHandle>(null);

  const [inviteRows, setInviteRows] = useState<OnboardingInviteRow[]>(
    initial.invites,
  );
  const [inviteMessage, setInviteMessage] = useState(initial.inviteMessage);

  const [objectionPickerOpen, setObjectionPickerOpen] = useState(false);
  const [argumentPickerOpen, setArgumentPickerOpen] = useState(false);

  const pitchLen = companyPitch.length;
  const vocabLen = industryVocabulary.length;

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
          meetingTypes:
            meetingTypesRef.current?.resolveValues() ??
            trimProcessStringListValues(meetingTypeItems),
          pipelineStages:
            pipelineStagesRef.current?.resolveValues() ??
            trimProcessStringListValues(pipelineStageItems),
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
    <div className="grid min-h-svh grid-cols-1 bg-white lg:grid-cols-2">
      <section className="hidden bg-brand/10 lg:flex lg:items-center lg:justify-center">
        <SignupFlowIllustration />
      </section>

      <main className="flex min-h-svh flex-col overflow-hidden bg-white">
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-y-auto px-6 py-10 sm:px-10 xl:max-w-3xl">
          <header className="mb-8 flex shrink-0 flex-col items-center">
            <div className="mx-auto w-full max-w-lg text-center">
              <h1 className="text-[36px] font-semibold leading-tight tracking-tight">
                Personnalisons votre coach
              </h1>
            </div>
          </header>
          {error ? (
            <p
              className="bg-destructive/10 text-destructive mb-6 rounded-lg border border-destructive/20 px-4 py-3 text-sm"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {step === 1 ? (
            <div className="space-y-8">
              <OnboardingStepRail step={step} />
              <div className="flex flex-col gap-6">
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-foreground">
                    Secteur d’activité
                  </Label>
                  <select
                    id="industry"
                    className={cn(nativeSelectClassName, "h-10")}
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
                  <Label htmlFor="teamSize" className="text-foreground">
                    Taille de l’équipe commerciale
                  </Label>
                  <select
                    id="teamSize"
                    className={cn(nativeSelectClassName, "h-10")}
                    value={
                      teamSizeOptions.some(
                        (o) => o.value === commercialTeamSize,
                      )
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
                  <Label htmlFor="cycle" className="text-foreground">
                    Cycle de vente moyen
                  </Label>
                  <select
                    id="cycle"
                    className={cn(nativeSelectClassName, "h-10")}
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
                  <Label htmlFor="ticket" className="text-foreground">
                    Ticket moyen
                  </Label>
                  <select
                    id="ticket"
                    className={cn(nativeSelectClassName, "h-10")}
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
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-8">
              <OnboardingStepRail step={step} />
              <div className="flex flex-col gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="pitch" className="text-foreground">
                      Pitch de l&apos;entreprise
                    </Label>
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
                    placeholder="Décrivez en quelques lignes ce que vous vendez, à qui, et quel problème vous résolvez."
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-base">Objections principales</Label>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      Ex. « C&apos;est trop cher », « On a déjà un prestataire
                      », « Ce n&apos;est pas le bon moment », « Il faut que
                      j&apos;en parle à mon directeur », « On va réfléchir »
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
                    className={coachListAddSecondaryButtonClass}
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
                      Ex. « ROI démontré : nos clients réduisent leurs coûts de
                      30 % en moyenne », « Livraison : livraison sur site en
                      moins de 48 h »
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
                            setKeyArguments((xs) =>
                              xs.filter((_, j) => j !== i),
                            )
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
                    className={coachListAddSecondaryButtonClass}
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
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-8">
              <OnboardingStepRail step={step} />
              <div className="flex flex-col gap-6">
                <ProcessStringListSection
                  ref={meetingTypesRef}
                  label="Type de RDV"
                  addButtonLabel="+ Ajouter un type"
                  draftPlaceholder="Nouveau type de RDV"
                  items={meetingTypeItems}
                  setItems={setMeetingTypeItems}
                />
                <ProcessStringListSection
                  ref={pipelineStagesRef}
                  label="Étapes du pipeline"
                  addButtonLabel="+ Ajouter une étape"
                  draftPlaceholder="Nouvelle étape"
                  items={pipelineStageItems}
                  setItems={setPipelineStageItems}
                />
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-8">
              <OnboardingStepRail step={step} />
              <div className="flex flex-col gap-6">
                <TeamInviteRowsField
                  rows={inviteRows}
                  onRowsChange={setInviteRows}
                  label="Invitez votre équipe"
                />

                <div className="space-y-2">
                  <Label htmlFor="inviteMsg" className="text-foreground">
                    Message d&apos;invitation
                  </Label>
                  <InviteMessageRichEditor
                    key="invite-msg-editor"
                    initialHtml={inviteMessage}
                    onHtmlChange={setInviteMessage}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex w-full items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={step <= 1 || pending}
              className="h-10 shrink-0"
            >
              Retour
            </Button>
            <Button
              type="button"
              onClick={goNext}
              disabled={pending}
              data-feedback-id="onboarding-next"
              className={cn(
                "h-10 shrink-0 rounded-md border-0 px-6 font-medium text-white shadow-sm",
                "bg-brand hover:bg-brand-hover dark:bg-brand dark:hover:bg-brand-hover",
              )}
            >
              {step === 4 ? "Terminer" : "Suivant"}
            </Button>
          </div>

          <CoachSharedPhrasePickerSheet
            kind="OBJECTION"
            open={objectionPickerOpen}
            onOpenChange={setObjectionPickerOpen}
            title="Objections — collection partagée"
            description="Choisissez des formulations existantes ou créez-en une nouvelle pour tout le monde."
            alreadyChosen={objections}
            onAddToList={(texts) =>
              setObjections((xs) => mergeUniqueCoachPhrases(xs, texts))
            }
          />
          <CoachSharedPhrasePickerSheet
            kind="ARGUMENT"
            open={argumentPickerOpen}
            onOpenChange={setArgumentPickerOpen}
            title="Arguments — collection partagée"
            description="Choisissez des formulations existantes ou créez-en une nouvelle pour tout le monde."
            alreadyChosen={keyArguments}
            onAddToList={(texts) =>
              setKeyArguments((xs) => mergeUniqueCoachPhrases(xs, texts))
            }
          />
        </div>
      </main>
    </div>
  );
}
