"use client";

import { useState, useTransition, type ReactNode } from "react";
import { prepareBriefingAction } from "@/app/[locale]/company/preparer/actions";
import { ContactPicker } from "@/components/organisms/contact-picker";
import { PrdEmptyState } from "@/components/molecules/prd-empty-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import {
  libelleDiscDominant,
  libelleSoncasDominant,
} from "@/lib/profil-dominant-libelle";
import { Sparkles } from "lucide-react";
import type { MeetingBriefingResult } from "@/src/core/domain/meeting-briefing-zod";

/*
  Un seul message, « Impossible de générer le briefing. », couvrait quatre
  causes qui n'appellent pas du tout la même action : une saisie invalide, un
  contact effacé entre deux écrans, une session expirée, aucune organisation
  active. Le commercial relançait la même requête sans savoir quoi corriger.
*/
function messageErreur(code: string): string {
  if (code === "VALIDATION") {
    return "Choisissez un contact et une étape cible.";
  }
  if (code === "NOT_FOUND") {
    return "Ce contact est introuvable. Rechargez la page, ou choisissez un autre contact.";
  }
  if (code === "UNAUTHENTICATED") {
    return "Votre session a expiré. Reconnectez-vous pour préparer un briefing.";
  }
  if (code === "NO_ORG") {
    return "Aucune organisation active. Sélectionnez une organisation avant de préparer un briefing.";
  }
  return `Impossible de préparer le briefing (${code}).`;
}

type BriefingAffiche = {
  briefing: MeetingBriefingResult;
  personName: string | null;
  hasHistory: boolean;
  /*
    L'étape voyage avec le briefing. Le sélecteur reste modifiable après la
    génération : un briefing préparé pour « Qualifié » s'affichait sinon sous
    une étape « Proposition » qu'il n'avait jamais vue.
  */
  targetStage: string;
};

function BriefingSection({
  titre,
  children,
}: {
  titre: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-sm font-medium">{titre}</h3>
      {children}
    </section>
  );
}

function BriefingListe({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
      {items.map((item, index) => (
        <li key={`${index}-${item}`}>{item}</li>
      ))}
    </ul>
  );
}

function CarteBriefing({ affiche }: { affiche: BriefingAffiche }) {
  const { briefing, personName, hasHistory, targetStage } = affiche;

  /*
    `discDominant` et `soncasDominant` sont des chaînes libres, et le modèle
    reçoit les analyses stockées telles quelles : il recopiait « D » et
    « securite », le vocabulaire de la base, sur l'écran d'un commercial qui
    prépare son rendez-vous. La traduction ne peut pas vivre dans le prompt,
    qu'un super-administrateur peut réécrire ; elle vit ici.

    Une moitié absente disparaît au lieu d'afficher un tiret : « Levier SONCAS
    non renseigné » ne s'écrit pas, il ne s'affiche simplement pas.
  */
  const profils = [
    {
      cle: "disc",
      terme: "Profil DISC",
      valeur: libelleDiscDominant(briefing.discDominant),
    },
    {
      cle: "soncas",
      terme: "Levier SONCAS",
      valeur: libelleSoncasDominant(briefing.soncasDominant),
    },
  ].filter((profil) => profil.valeur !== null);

  /*
    D'où viennent les conseils : le commercial doit savoir s'il lit une lecture
    de CE prospect ou un conseil d'étape valable pour n'importe qui. La bannière
    au-dessus dit déjà l'absence d'historique ; cette ligne ne traite donc que
    ce que la bannière ne peut pas dire, un historique présent mais sans analyse
    exploitable.
  */
  const origineDesConseils = !hasHistory
    ? null
    : briefing.genericAdvice
      ? "Conseils génériques : les rendez-vous déjà enregistrés avec ce prospect n'ont pas encore d'analyse exploitable."
      : "Conseils tirés des rendez-vous déjà analysés avec ce prospect.";

  const synthese = briefing.lastMeetingSummary.trim();
  const conseils = briefing.stageAdvice.trim();

  return (
    <article className="bg-card space-y-5 rounded-xl border p-5">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">
          Briefing : {personName ?? "Prospect"}
        </h2>
        <p className="text-muted-foreground text-sm">
          Préparé pour l&apos;étape « {targetStage} ».
        </p>
        {profils.length > 0 ? (
          <dl className="flex flex-wrap gap-2 pt-1">
            {profils.map((profil) => (
              <div
                key={profil.cle}
                className="flex items-baseline gap-1.5 rounded-lg bg-muted px-2.5 py-1 dark:bg-neutral-800/60"
              >
                <dt className="text-muted-foreground text-xs">
                  {profil.terme}
                </dt>
                <dd className="text-xs font-medium">{profil.valeur}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </header>

      {synthese !== "" ? (
        <p className="text-sm leading-relaxed">{synthese}</p>
      ) : null}

      {briefing.customQuestions.length > 0 ? (
        <BriefingSection titre="Questions à poser">
          <BriefingListe items={briefing.customQuestions} />
        </BriefingSection>
      ) : null}

      {/*
        « Actions Start » écrivait la clé anglaise du modèle KISS sur un écran
        français. Le produit dit « À démarrer » partout ailleurs.
      */}
      {briefing.startActions.length > 0 ? (
        <BriefingSection titre="Actions à démarrer">
          <BriefingListe items={briefing.startActions} />
        </BriefingSection>
      ) : null}

      {briefing.openPoints.length > 0 ? (
        <BriefingSection titre="Points ouverts">
          <BriefingListe items={briefing.openPoints} />
        </BriefingSection>
      ) : null}

      {conseils !== "" ? (
        <BriefingSection titre="Conseils pour l'étape">
          <p className="text-sm leading-relaxed">{conseils}</p>
          {origineDesConseils ? (
            <p className="text-muted-foreground text-xs">
              {origineDesConseils}
            </p>
          ) : null}
        </BriefingSection>
      ) : null}
    </article>
  );
}

export function PrepareMeetingBriefingForm({
  pipelineStageOptions,
}: {
  pipelineStageOptions: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [targetStage, setTargetStage] = useState(pipelineStageOptions[0] ?? "");
  const [affiche, setAffiche] = useState<BriefingAffiche | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <form
        className="space-y-4 rounded-xl border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const fd = new FormData(e.currentTarget);
          const personId = String(fd.get("personId") ?? "");
          if (!personId) {
            setError("Choisissez un contact.");
            return;
          }
          const etapeDemandee = String(fd.get("targetStage") ?? targetStage);
          startTransition(async () => {
            /*
              L'action appelle la passerelle IA. Sans ce filet, une panne de
              passerelle remontait en promesse rejetée : le bouton reprenait
              son état normal et rien ne s'affichait, l'écran semblait n'avoir
              rien fait.
            */
            try {
              const res = await prepareBriefingAction({
                personId,
                targetStage: etapeDemandee,
              });
              if (!res.ok) {
                setError(messageErreur(res.error));
                return;
              }
              setAffiche({
                briefing: res.briefing,
                personName: res.personName,
                hasHistory: res.hasHistory,
                targetStage: etapeDemandee,
              });
            } catch {
              setError(
                "Le briefing n'a pas pu être généré. Réessayez dans un instant.",
              );
            }
          });
        }}
      >
        <ContactPicker />
        <div className="space-y-2">
          <Label htmlFor="targetStage">Étape cible du prochain RDV</Label>
          <select
            id="targetStage"
            name="targetStage"
            className={nativeSelectClassName}
            value={targetStage}
            onChange={(e) => setTargetStage(e.target.value)}
            required
          >
            {pipelineStageOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Génération…" : "Préparer le briefing"}
        </Button>
      </form>

      {affiche && !affiche.hasHistory ? (
        <PrdEmptyState
          icon={Sparkles}
          title="Premier RDV avec ce prospect"
          description="Aucun rendez-vous n'est encore enregistré avec ce contact. Le briefing s'appuie donc sur l'étape visée, pas sur son historique."
        />
      ) : null}

      {affiche ? <CarteBriefing affiche={affiche} /> : null}
    </div>
  );
}
