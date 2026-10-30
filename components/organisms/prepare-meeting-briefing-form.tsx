"use client";

import { useState, useTransition } from "react";
import {
  CircleHelp,
  ClipboardCheck,
  Flag,
  Hourglass,
  Lightbulb,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";
import { prepareBriefingAction } from "@/app/[locale]/company/preparer/actions";
import { ToneChip } from "@/components/atoms/tone-chip";
import { ContactPicker } from "@/components/organisms/contact-picker";
import { CopyTextButton } from "@/components/molecules/copy-text-button";
import { GoldenQuestionCard } from "@/components/molecules/golden-question-card";
import {
  LikelyObjectionsList,
  PrepareCard,
  PrepareList,
} from "@/components/molecules/prepare-card";
import { PrdEmptyState } from "@/components/molecules/prd-empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import {
  libelleDiscDominant,
  libelleSoncasDominant,
} from "@/lib/profil-dominant-libelle";
import { meetingBriefingAsText } from "@/src/core/domain/meeting-briefing-text";
import type { MeetingBriefingResult } from "@/src/core/domain/meeting-briefing-zod";
import type { MeetingChallenge } from "@/src/core/domain/meeting-challenges";

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
  /** Les défis du dernier rendez-vous, recopiés tels qu'ils ont été écrits. */
  challenges: MeetingChallenge[];
  /*
    L'étape voyage avec le briefing. Le sélecteur reste modifiable après la
    génération : un briefing préparé pour « Qualifié » s'affichait sinon sous
    une étape « Proposition » qu'il n'avait jamais vue.
  */
  targetStage: string;
};

function CarteBriefing({ affiche }: { affiche: BriefingAffiche }) {
  const { briefing, personName, hasHistory, challenges, targetStage } = affiche;

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
  const question = briefing.goldenQuestion.trim();
  const objectif = briefing.meetingGoal.trim();
  const parler = briefing.howToTalk.trim();
  const conseils = briefing.stageAdvice.trim();
  const texte = meetingBriefingAsText(briefing, {
    personName,
    targetStage,
    challenges,
  });

  return (
    <article className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-lg font-semibold">
            Briefing : {personName ?? "Prospect"}
          </h2>
          <p className="text-muted-foreground text-sm">
            Préparé pour l&apos;étape « {targetStage} ».
          </p>
          {profils.length > 0 ? (
            <p className="flex flex-wrap gap-1.5 pt-0.5">
              {profils.map((profil) => (
                <ToneChip key={profil.cle} tone="brand">
                  {profil.terme} : {profil.valeur}
                </ToneChip>
              ))}
            </p>
          ) : null}
        </div>
        <CopyTextButton
          text={texte}
          label="Copier la fiche"
          variant="default"
        />
      </header>

      {synthese !== "" ? (
        <p className="text-sm leading-relaxed">{synthese}</p>
      ) : null}

      {question !== "" ? (
        <GoldenQuestionCard
          title="Votre question en or"
          questions={[question]}
          why={briefing.goldenQuestionWhy}
        />
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {objectif !== "" ? (
          <PrepareCard icon={Target} title="Objectif du rendez-vous">
            <p>{objectif}</p>
          </PrepareCard>
        ) : null}

        {parler !== "" ? (
          <PrepareCard
            icon={MessageCircle}
            tone="teal"
            title="Comment lui parler"
          >
            <p>{parler}</p>
          </PrepareCard>
        ) : null}

        {briefing.customQuestions.length > 0 ? (
          <PrepareCard icon={CircleHelp} tone="coral" title="Questions à poser">
            <PrepareList items={briefing.customQuestions} />
          </PrepareCard>
        ) : null}

        {briefing.likelyObjections.length > 0 ? (
          <PrepareCard
            icon={ShieldAlert}
            tone="amber"
            title="Objections à anticiper"
          >
            <LikelyObjectionsList items={briefing.likelyObjections} />
          </PrepareCard>
        ) : null}

        {challenges.length > 0 ? (
          <PrepareCard icon={Flag} title="Vos défis du dernier rendez-vous">
            <ul className="space-y-3">
              {challenges.map((challenge) => (
                <li key={challenge.title}>
                  <p className="font-semibold">{challenge.title}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {challenge.detail}
                  </p>
                </li>
              ))}
            </ul>
          </PrepareCard>
        ) : null}

        {/*
          « Actions Start » écrivait la clé anglaise du modèle KISS sur un écran
          français : ce sont les gestes à préparer avant d'y aller.
        */}
        {briefing.startActions.length > 0 ? (
          <PrepareCard
            icon={ClipboardCheck}
            tone="teal"
            title="À préparer avant le rendez-vous"
          >
            <PrepareList items={briefing.startActions} />
          </PrepareCard>
        ) : null}

        {briefing.openPoints.length > 0 ? (
          <PrepareCard icon={Hourglass} tone="coral" title="Points ouverts">
            <PrepareList items={briefing.openPoints} />
          </PrepareCard>
        ) : null}

        {conseils !== "" ? (
          <PrepareCard
            icon={Lightbulb}
            tone="amber"
            title="Conseils pour l'étape"
          >
            <p>{conseils}</p>
            {origineDesConseils ? (
              <p className="text-muted-foreground text-xs">
                {origineDesConseils}
              </p>
            ) : null}
          </PrepareCard>
        ) : null}
      </div>
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
      <Card>
        <CardContent className="py-2">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              const fd = new FormData(e.currentTarget);
              const personId = String(fd.get("personId") ?? "");
              if (!personId) {
                setError("Choisissez un contact.");
                return;
              }
              const etapeDemandee = String(
                fd.get("targetStage") ?? targetStage,
              );
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
                    challenges: res.challenges,
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
            <Button
              type="submit"
              disabled={pending}
              className="bg-brand text-brand-foreground hover:bg-brand-hover"
            >
              {pending
                ? "Préparation du briefing… (quelques secondes)"
                : "Préparer le briefing"}
            </Button>
          </form>
        </CardContent>
      </Card>

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
