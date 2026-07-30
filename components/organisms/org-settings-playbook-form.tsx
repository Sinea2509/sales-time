"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOrganizationPlaybook } from "@/app/[locale]/company/settings/actions";
import {
  ProcessStringListSection,
  processItemsFromStrings,
  trimProcessStringListValues,
  type ProcessStringListItem,
  type ProcessStringListSectionHandle,
} from "@/components/molecules/process-string-list-section";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import {
  ORGANIZATION_PLAYBOOK_LIST_LIMITS,
  ORGANIZATION_PLAYBOOK_TEXT_LIMITS,
  type OrganizationPlaybookForm,
} from "@/src/core/domain/organization-playbook";

const TEXT_LIMITS = ORGANIZATION_PLAYBOOK_TEXT_LIMITS;
const LIST_LIMITS = ORGANIZATION_PLAYBOOK_LIST_LIMITS;

/**
 * Un champ libre du playbook, avec son compteur.
 *
 * Le compteur n'est pas décoratif : les limites sont appliquées côté serveur,
 * et un manager qui colle une page entière doit voir tout de suite où il en
 * est plutôt que de découvrir un refus à l'enregistrement.
 */
function PlaybookTextField({
  id,
  label,
  hint,
  value,
  onChange,
  maxLength,
  rows,
  canEdit,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (next: string) => void;
  maxLength: number;
  rows: number;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-muted-foreground text-xs tabular-nums">
          {value.length}/{maxLength}
        </span>
      </div>
      <p className="text-muted-foreground text-sm">{hint}</p>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        rows={rows}
        readOnly={!canEdit}
        disabled={!canEdit}
      />
    </div>
  );
}

export function OrgSettingsPlaybookForm({
  initial,
  promptPreview,
  canEdit = true,
}: {
  initial: OrganizationPlaybookForm;
  promptPreview: string | null;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [offer, setOffer] = useState(initial.offer);
  const [idealCustomer, setIdealCustomer] = useState(initial.idealCustomer);
  const [salesMethod, setSalesMethod] = useState(initial.salesMethod);
  const [pricingRules, setPricingRules] = useState(initial.pricingRules);

  const differentiatorsRef = useRef<ProcessStringListSectionHandle>(null);
  const competitorsRef = useRef<ProcessStringListSectionHandle>(null);
  const qualificationRef = useRef<ProcessStringListSectionHandle>(null);
  const redLinesRef = useRef<ProcessStringListSectionHandle>(null);

  const [differentiators, setDifferentiators] = useState<
    ProcessStringListItem[]
  >(() => processItemsFromStrings("dif", initial.differentiators));
  const [competitors, setCompetitors] = useState<ProcessStringListItem[]>(() =>
    processItemsFromStrings("cmp", initial.competitors),
  );
  const [qualification, setQualification] = useState<ProcessStringListItem[]>(
    () => processItemsFromStrings("qua", initial.qualificationCriteria),
  );
  const [redLines, setRedLines] = useState<ProcessStringListItem[]>(() =>
    processItemsFromStrings("red", initial.redLines),
  );

  /*
    La saisie en cours compte. `resolveValues` récupère la ligne encore dans le
    champ d'ajout, pour qu'un manager qui tape une ligne rouge puis clique
    directement sur Enregistrer ne la perde pas en silence.
  */
  function listValues(
    ref: React.RefObject<ProcessStringListSectionHandle | null>,
    items: ProcessStringListItem[],
  ): string[] {
    return ref.current?.resolveValues() ?? trimProcessStringListValues(items);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setMessage(null);
    startTransition(async () => {
      const r = await updateOrganizationPlaybook({
        offer: offer.trim(),
        idealCustomer: idealCustomer.trim(),
        differentiators: listValues(differentiatorsRef, differentiators),
        competitors: listValues(competitorsRef, competitors),
        salesMethod: salesMethod.trim(),
        qualificationCriteria: listValues(qualificationRef, qualification),
        pricingRules: pricingRules.trim(),
        redLines: listValues(redLinesRef, redLines),
      });
      if (!r.ok) {
        setMessage({ type: "err", text: r.message });
        return;
      }
      setMessage({ type: "ok", text: "Enregistré." });
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      {message ? (
        <p
          className={cn(
            "text-sm",
            message.type === "ok"
              ? "text-green-700 dark:text-green-400"
              : "text-destructive",
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      <div className="border-border bg-muted/40 space-y-2 rounded-lg border p-4">
        <p className="text-sm leading-relaxed">
          Ce playbook est joint à chaque analyse de rendez-vous. L&apos;IA
          s&apos;en sert pour juger la pertinence des arguments et repérer les
          écarts avec votre méthode. Il décrit votre intention, pas ce qui
          s&apos;est dit : en cas de contradiction, c&apos;est toujours le
          compte rendu du rendez-vous qui fait foi.
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Le nom, le secteur et le cycle de vente viennent de{" "}
          <Link
            href="/company/settings/contexte"
            className="text-brand font-medium underline underline-offset-2"
          >
            Contexte
          </Link>
          , le pitch, les objections et les arguments clés de{" "}
          <Link
            href="/company/settings/coach-ia"
            className="text-brand font-medium underline underline-offset-2"
          >
            Coach IA
          </Link>
          . Ils sont repris automatiquement, inutile de les répéter ici.
        </p>
      </div>

      <PlaybookTextField
        id="playbook-offer"
        label="Offre"
        hint="Ce que vous vendez, en clair : produits, prestations, formats, durées."
        value={offer}
        onChange={setOffer}
        maxLength={TEXT_LIMITS.offer}
        rows={5}
        canEdit={canEdit}
      />

      <PlaybookTextField
        id="playbook-ideal-customer"
        label="Client idéal"
        hint="À qui vous vendez le mieux : taille, secteur, fonction du décideur, déclencheur d'achat."
        value={idealCustomer}
        onChange={setIdealCustomer}
        maxLength={TEXT_LIMITS.idealCustomer}
        rows={4}
        canEdit={canEdit}
      />

      <ProcessStringListSection
        ref={differentiatorsRef}
        label="Différenciateurs"
        addButtonLabel="+ Ajouter un différenciateur"
        draftPlaceholder="Ce que vous seul apportez"
        items={differentiators}
        setItems={setDifferentiators}
        maxItems={LIST_LIMITS.differentiators.items}
        maxLen={LIST_LIMITS.differentiators.length}
        canEdit={canEdit}
      />

      <ProcessStringListSection
        ref={competitorsRef}
        label="Concurrents fréquemment rencontrés"
        addButtonLabel="+ Ajouter un concurrent"
        draftPlaceholder="Nom du concurrent"
        items={competitors}
        setItems={setCompetitors}
        maxItems={LIST_LIMITS.competitors.items}
        maxLen={LIST_LIMITS.competitors.length}
        canEdit={canEdit}
      />

      <PlaybookTextField
        id="playbook-sales-method"
        label="Méthode de vente attendue"
        hint="Le déroulé que vous attendez d'un rendez-vous réussi : étapes, questions obligatoires, preuves à apporter."
        value={salesMethod}
        onChange={setSalesMethod}
        maxLength={TEXT_LIMITS.salesMethod}
        rows={6}
        canEdit={canEdit}
      />

      <ProcessStringListSection
        ref={qualificationRef}
        label="Critères de qualification"
        addButtonLabel="+ Ajouter un critère"
        draftPlaceholder="Ce qu'il faut avoir vérifié avant d'avancer"
        items={qualification}
        setItems={setQualification}
        maxItems={LIST_LIMITS.qualificationCriteria.items}
        maxLen={LIST_LIMITS.qualificationCriteria.length}
        canEdit={canEdit}
      />

      <PlaybookTextField
        id="playbook-pricing-rules"
        label="Règles de prix et de remise"
        hint="Ce qu'un commercial peut accorder seul, et à partir de quand il doit faire valider."
        value={pricingRules}
        onChange={setPricingRules}
        maxLength={TEXT_LIMITS.pricingRules}
        rows={4}
        canEdit={canEdit}
      />

      <ProcessStringListSection
        ref={redLinesRef}
        label="Lignes rouges"
        addButtonLabel="+ Ajouter une ligne rouge"
        draftPlaceholder="Ce qu'on ne promet jamais"
        items={redLines}
        setItems={setRedLines}
        maxItems={LIST_LIMITS.redLines.items}
        maxLen={LIST_LIMITS.redLines.length}
        canEdit={canEdit}
      />

      <details className="border-border rounded-lg border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
          Voir le bloc transmis à l&apos;IA
        </summary>
        <div className="border-border border-t p-4">
          {promptPreview ? (
            <pre className="text-muted-foreground overflow-x-auto text-xs leading-relaxed whitespace-pre-wrap">
              {promptPreview}
            </pre>
          ) : (
            <p className="text-muted-foreground text-sm">
              Rien n&apos;est encore transmis : remplissez au moins un champ,
              ici ou dans Contexte et Coach IA.
            </p>
          )}
        </div>
      </details>

      {canEdit ? (
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={pending}
            className="bg-brand text-brand-foreground hover:bg-brand-hover"
          >
            Enregistrer
          </Button>
        </div>
      ) : null}
    </form>
  );
}
