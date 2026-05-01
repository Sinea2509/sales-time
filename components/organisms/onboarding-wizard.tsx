"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { Fragment, useMemo, useState, useTransition } from "react";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { normalizePhraseKey } from "@/lib/onboarding-shared-default-phrases";
import { optionsWithLegacy } from "@/lib/options-with-legacy";
import {
  ONBOARDING_INVITE_ROLE_OPTIONS,
  type OnboardingInviteRow,
} from "@/lib/onboarding-invites";
import { OnboardingPhrasePickerSheet } from "@/components/organisms/onboarding-phrase-picker-sheet";
import { InviteMessageRichEditor } from "@/components/molecules/invite-message-rich-editor";
import { SignupFlowIllustration } from "@/components/molecules/signup-flow-illustration";
import { cn } from "@/lib/utils";

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

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent py-1 pl-3 pr-10 text-base outline-none",
  "focus-visible:border-input focus-visible:ring-0",
  "disabled:pointer-events-none disabled:opacity-50 md:text-sm",
  "dark:bg-input/30",
);

const onboardingSecondaryGreyClass =
  "border border-neutral-200 bg-[#F5F5F5] text-foreground shadow-none hover:bg-[#EBEBEB] dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700";

const onboardingSecondaryGreySmClass = cn(
  "px-4 text-sm shadow-none",
  onboardingSecondaryGreyClass,
);

/** CTAs « + Ajouter … » sous les listes (étapes 2–3) — même rythme vertical que l’invitation (étape 4). */
const onboardingListAddCtaClass = cn(
  "inline-flex w-full items-center justify-center sm:w-auto",
  "my-3 px-5 py-4 text-sm font-medium",
  onboardingSecondaryGreyClass,
);

/** Step 4 — align with signup left column (`bg-brand/10`) + violet label text */
const onboardingInviteVioletCtaClass = cn(
  "inline-flex w-full items-center justify-center gap-2 rounded-md border border-transparent",
  "my-3 bg-brand/10 px-5 py-4 text-sm font-medium text-brand shadow-none",
  "hover:bg-brand/15 hover:text-brand sm:w-auto",
  "dark:bg-brand/10 dark:text-brand-muted dark:hover:bg-brand/20 dark:hover:text-brand-muted",
);

type OnboardingProcessListItem = { id: string; value: string };

function simpleHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

/** Stable across SSR/client; unique per index + value at first paint. */
function processItemsFromStrings(
  prefix: "mt" | "pl",
  values: string[],
): OnboardingProcessListItem[] {
  return values.map((value, index) => ({
    id: `${prefix}-${index}-${simpleHash(value)}`,
    value,
  }));
}

function newProcessRowId(): string {
  return crypto.randomUUID();
}

function OnboardingProcessRow({
  value,
  onSave,
  onDelete,
  sortable,
}: {
  value: string;
  onSave: (next: string) => void;
  onDelete: () => void;
  sortable?: {
    setNodeRef: (node: HTMLElement | null) => void;
    style: CSSProperties;
    dragAttributes: DraggableAttributes;
    dragListeners: DraggableSyntheticListeners;
    isDragging: boolean;
  };
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
    <li
      ref={sortable?.setNodeRef}
      style={sortable?.style}
      className={cn(sortable?.isDragging && "relative z-[1]")}
    >
      <div
        className={cn(
          "group border-border flex items-center gap-2 rounded-md border bg-background px-3 py-2.5 transition-colors",
          "hover:border-brand/20 hover:bg-brand/5",
          sortable?.isDragging && "border-brand/30 bg-brand/5 shadow-sm",
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
            {sortable ? (
              <button
                type="button"
                className={cn(
                  "text-muted-foreground hover:text-foreground -ml-1 shrink-0 cursor-grab touch-none rounded-md p-1.5 active:cursor-grabbing",
                  "hover:bg-muted/80 outline-none",
                )}
                aria-label="Glisser pour réordonner"
                {...sortable.dragAttributes}
                {...(sortable.dragListeners ?? {})}
              >
                <GripVertical className="size-4" />
              </button>
            ) : null}
            <span className="min-w-0 flex-1 text-sm leading-snug">{value}</span>
            <div className="flex shrink-0 gap-0.5">
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

function SortableProcessRow({
  item,
  setItems,
}: {
  item: OnboardingProcessListItem;
  setItems: Dispatch<SetStateAction<OnboardingProcessListItem[]>>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <OnboardingProcessRow
      value={item.value}
      sortable={{
        setNodeRef,
        style,
        dragAttributes: attributes,
        dragListeners: listeners,
        isDragging,
      }}
      onSave={(next) =>
        setItems((xs) =>
          xs.map((r) => (r.id === item.id ? { ...r, value: next } : r)),
        )
      }
      onDelete={() => setItems((xs) => xs.filter((r) => r.id !== item.id))}
    />
  );
}

function OnboardingProcessSortableList({
  items,
  setItems,
}: {
  items: OnboardingProcessListItem[];
  setItems: Dispatch<SetStateAction<OnboardingProcessListItem[]>>;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((current) => {
      const oldIndex = current.findIndex((x) => x.id === active.id);
      const newIndex = current.findIndex((x) => x.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return current;
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {items.map((item) => (
            <SortableProcessRow key={item.id} item={item} setItems={setItems} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
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
    OnboardingProcessListItem[]
  >(() => processItemsFromStrings("mt", initial.meetingTypes));
  const [pipelineStageItems, setPipelineStageItems] = useState<
    OnboardingProcessListItem[]
  >(() => processItemsFromStrings("pl", initial.pipelineStages));

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
          meetingTypes: meetingTypeItems.map((x) => x.value).filter(Boolean),
          pipelineStages: pipelineStageItems.map((x) => x.value).filter(Boolean),
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
                  className={cn(selectClassName, "h-10")}
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
                  className={cn(selectClassName, "h-10")}
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
                <Label htmlFor="cycle" className="text-foreground">
                  Cycle de vente moyen
                </Label>
                <select
                  id="cycle"
                  className={cn(selectClassName, "h-10")}
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
                  className={cn(selectClassName, "h-10")}
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
                  className={onboardingListAddCtaClass}
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
                  className={onboardingListAddCtaClass}
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
              <div className="space-y-3">
                <Label className="text-foreground">Type de RDV</Label>
                <OnboardingProcessSortableList
                  items={meetingTypeItems}
                  setItems={setMeetingTypeItems}
                />
                {meetingDraftOpen ? (
                  <div className="flex flex-col gap-2 rounded-md border border-dashed border-brand/30 bg-brand/5 p-3 sm:flex-row sm:items-center">
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
                          setMeetingTypeItems((xs) => [
                            ...xs,
                            { id: newProcessRowId(), value: v },
                          ]);
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
                        variant="secondary"
                        className={onboardingSecondaryGreySmClass}
                        onClick={() => {
                          const v = draftMeeting.trim();
                          if (!v) return;
                          setMeetingTypeItems((xs) => [
                            ...xs,
                            { id: newProcessRowId(), value: v },
                          ]);
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
                  variant="secondary"
                  className={onboardingListAddCtaClass}
                  onClick={() => {
                    setMeetingDraftOpen(true);
                    setDraftMeeting("");
                  }}
                >
                  + Ajouter un type
                </Button>
              </div>

              <div className="space-y-3">
                <Label className="text-foreground">Étapes du pipeline</Label>
                <OnboardingProcessSortableList
                  items={pipelineStageItems}
                  setItems={setPipelineStageItems}
                />
                {pipelineDraftOpen ? (
                  <div className="flex flex-col gap-2 rounded-md border border-dashed border-brand/30 bg-brand/5 p-3 sm:flex-row sm:items-center">
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
                          setPipelineStageItems((xs) => [
                            ...xs,
                            { id: newProcessRowId(), value: v },
                          ]);
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
                        variant="secondary"
                        className={onboardingSecondaryGreySmClass}
                        onClick={() => {
                          const v = draftStage.trim();
                          if (!v) return;
                          setPipelineStageItems((xs) => [
                            ...xs,
                            { id: newProcessRowId(), value: v },
                          ]);
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
                  variant="secondary"
                  className={onboardingListAddCtaClass}
                  onClick={() => {
                    setPipelineDraftOpen(true);
                    setDraftStage("");
                  }}
                >
                  + Ajouter une étape
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-8">
            <OnboardingStepRail step={step} />
            <div className="flex flex-col gap-6">
              <div className="space-y-3">
                <Label className="text-foreground">Invitez votre équipe</Label>
                <ul className="space-y-2">
                  {inviteRows.map((row, i) => (
                    <li
                      key={`inv-row-${i}`}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center"
                    >
                      <Input
                        type="email"
                        className="h-10 sm:flex-1"
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
                        className={cn(selectClassName, "h-10 sm:w-44 shrink-0")}
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
                  className={onboardingInviteVioletCtaClass}
                  onClick={() =>
                    setInviteRows((xs) => [
                      ...xs,
                      { email: "", role: "MEMBER" },
                    ])
                  }
                >
                  + Ajouter une invitation
                </Button>
              </div>

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
            className={cn(
              "h-10 shrink-0 rounded-md border-0 px-6 font-medium text-white shadow-sm",
              "bg-brand hover:bg-brand-hover dark:bg-brand dark:hover:bg-brand-hover",
            )}
          >
            {step === 4 ? "Terminer" : "Suivant"}
          </Button>
        </div>

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
      </main>
    </div>
  );
}
