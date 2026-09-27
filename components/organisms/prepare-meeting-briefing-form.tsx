"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { prepareBriefingAction } from "@/app/[locale]/company/preparer/actions";
import { ToneChip } from "@/components/atoms/tone-chip";
import { ContactPicker } from "@/components/organisms/contact-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import { cardTitleClass } from "@/lib/page-typography";
import { plurielFr } from "@/lib/pluriel-fr";
import {
  libelleDiscDominant,
  libelleSoncasDominant,
} from "@/lib/profil-dominant-libelle";
import type { MeetingBriefingResult } from "@/src/core/domain/meeting-briefing-zod";

/*
  Un seul message, « Impossible de générer le briefing. », couvrait quatre
  causes qui n'appellent pas du tout la même action : une saisie invalide, un
  contact effacé entre deux écrans, une session expirée, aucune organisation
  active. Le commercial relançait la même requête sans savoir quoi corriger.
*/
function messageErreur(code: string): string {
  if (code === "VALIDATION") {
    return "Choisissez un contact et un type de rendez-vous.";
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
  /** Le type de rendez-vous voyage avec le briefing : le sélecteur reste modifiable après. */
  meetingType: string;
  /** Rendez-vous analysés avec ce prospect, qui ont nourri le briefing. */
  historyCount: number;
};

function Paragraphe({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <p className="text-[14px] leading-[1.65]">
      <b>{titre}</b> {children}
    </p>
  );
}

/**
 * Le briefing, comme la maquette du 11 septembre le pose : à gauche ce qu'on
 * sait, le profil pressenti, ce qui reste à obtenir et les cinq questions ; à
 * droite l'objectif de sortie et le piège à éviter.
 */
function CarteBriefing({ affiche }: { affiche: BriefingAffiche }) {
  const { briefing, personName, hasHistory, meetingType, historyCount } =
    affiche;
  const disc = libelleDiscDominant(briefing.discDominant);
  const soncas = libelleSoncasDominant(briefing.soncasDominant);
  const profil = [
    soncas ? `levier SONCAS principal ${soncas}` : null,
    disc ? `style DISC ${disc}` : null,
  ].filter(Boolean);
  const synthese = briefing.lastMeetingSummary.trim();
  const conseils = briefing.stageAdvice.trim();
  const questions = briefing.customQuestions.filter((q) => q.trim());
  const ouverts = briefing.openPoints.filter((p) => p.trim());

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.62fr)_minmax(300px,1fr)]">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div>
            <h2 className={cardTitleClass}>
              Briefing, {personName ?? "prospect"}
            </h2>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Rendez-vous de {meetingType.toLowerCase()},{" "}
              {hasHistory
                ? `préparé à partir de ${historyCount} ${plurielFr(historyCount, "rendez-vous analysé", "rendez-vous analysés")} avec ce prospect.`
                : "préparé à partir du playbook : aucun rendez-vous n'est encore enregistré avec ce prospect."}
            </p>
          </div>

          {hasHistory && synthese ? (
            <Paragraphe titre="Ce qu'on sait déjà.">{synthese}</Paragraphe>
          ) : (
            <Paragraphe titre="Pas encore d'analyse.">
              {synthese ||
                "Ce prospect est enregistré mais aucun de ses rendez-vous n'a été analysé. Le briefing repart donc du playbook : un enjeu chiffré, un circuit de décision nommé, une suite datée."}
            </Paragraphe>
          )}
          {profil.length > 0 || conseils ? (
            <Paragraphe titre="Profil pressenti.">
              {profil.length > 0
                ? `${profil.join(", ").replace(/^./, (c) => c.toUpperCase())}. `
                : ""}
              {conseils}
            </Paragraphe>
          ) : null}
          {ouverts.length > 0 ? (
            <Paragraphe titre="Ce qui reste à obtenir.">
              {ouverts.join(" ")}
            </Paragraphe>
          ) : null}
          {briefing.genericAdvice && hasHistory ? (
            <p className="text-muted-foreground text-xs">
              Conseils génériques : les rendez-vous déjà enregistrés avec ce
              prospect n&apos;ont pas encore d&apos;analyse exploitable.
            </p>
          ) : null}

          {questions.length > 0 ? (
            <>
              <h3 className="mt-4 text-[13.4px] font-bold">
                {questions.length === 5
                  ? "Les cinq questions à poser"
                  : "Les questions à poser"}
              </h3>
              <ol className="grid gap-2.5">
                {questions.map((q, i) => (
                  <li
                    key={`${i}-${q}`}
                    className="flex gap-3 text-[14px] leading-[1.6]"
                  >
                    <b className="text-brand shrink-0">{i + 1}.</b>
                    <span>{q}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid content-start gap-4">
        <Card className="border-brand/30 bg-brand-soft shadow-none dark:bg-brand/10">
          <CardContent className="space-y-2 pt-6">
            <h2 className={cardTitleClass}>Objectif de sortie</h2>
            <p className="text-[14px] leading-[1.65]">
              {briefing.exitGoal.trim() ||
                "Repartir avec une date ferme posée en séance, un chiffre d'impact validé par le prospect, et le nom du décideur."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 pt-6">
            <h2 className={cardTitleClass}>Le piège à éviter</h2>
            <p className="text-[14px] leading-[1.65]">
              {briefing.trapToAvoid.trim() ||
                "La démonstration improvisée : elle consomme la découverte, répond à des besoins supposés, et repousse les questions qui comptent."}
            </p>
          </CardContent>
        </Card>
        {briefing.startActions.length > 0 ? (
          <Card>
            <CardContent className="space-y-2 pt-6">
              <h2 className={cardTitleClass}>À faire avant</h2>
              <ul className="grid gap-1.5 text-[13.5px] leading-relaxed">
                {briefing.startActions.map((a, i) => (
                  <li key={`${i}-${a}`}>{a}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export function PrepareMeetingBriefingForm({
  meetingTypeOptions,
}: {
  meetingTypeOptions: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [meetingType, setMeetingType] = useState(
    meetingTypeOptions.find((t) => t.toLowerCase().startsWith("démo")) ??
      meetingTypeOptions[0] ??
      "",
  );
  const [affiche, setAffiche] = useState<BriefingAffiche | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <Card className="max-w-[820px]">
        <CardContent className="space-y-4 pt-6">
          <div>
            <h2 className={cardTitleClass}>Rendez-vous de suivi</h2>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Pour un prospect déjà rencontré : le briefing repart de ce qui a
              été dit la dernière fois.
            </p>
          </div>
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
              const type = String(fd.get("meetingType") ?? meetingType);
              startTransition(async () => {
                /*
                  L'action appelle la passerelle IA. Sans ce filet, une panne
                  remontait en promesse rejetée : le bouton reprenait son état
                  normal et rien ne s'affichait.
                */
                try {
                  const res = await prepareBriefingAction({
                    personId,
                    targetStage: type,
                  });
                  if (!res.ok) {
                    setError(messageErreur(res.error));
                    return;
                  }
                  setAffiche({
                    briefing: res.briefing,
                    personName: res.personName,
                    hasHistory: res.hasHistory,
                    meetingType: type,
                    historyCount: res.historyCount,
                  });
                } catch {
                  setError(
                    "Le briefing n'a pas pu être généré. Réessayez dans un instant.",
                  );
                }
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <ContactPicker />
                <p className="text-muted-foreground mt-1.5 text-[11.5px]">
                  La liste se filtre à mesure que vous tapez.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingType">Type de rendez-vous</Label>
                <select
                  id="meetingType"
                  name="meetingType"
                  className={nativeSelectClassName}
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                  required
                >
                  {meetingTypeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <p className="text-muted-foreground text-[11.5px]">
                  La qualification et la découverte n&apos;apparaissent pas ici
                  : elles ont déjà eu lieu avec ce prospect.
                </p>
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
              <Sparkles aria-hidden className="size-4" />
              {pending ? "Génération…" : "Générer le briefing"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-muted/40 max-w-[820px] shadow-none">
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className={cardTitleClass}>
                Préparer un premier rendez-vous
              </h2>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Vous ne connaissez pas encore ce prospect, et il n&apos;a donc
                pas d&apos;historique dans Sales Time.
              </p>
            </div>
            <ToneChip tone="warn">Bientôt disponible</ToneChip>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              disabled
              placeholder="Nom de l'entreprise ou adresse de son site"
              aria-label="Nom de l'entreprise, fonctionnalité à venir"
              className="max-w-[380px]"
            />
            <Button type="button" variant="outline" disabled>
              Chercher et préparer
            </Button>
          </div>
          <p className="text-muted-foreground text-[11.5px] leading-relaxed">
            Sales Time ira chercher le secteur, la taille et l&apos;actualité
            récente de l&apos;entreprise pour vous proposer des questions
            d&apos;ouverture. Cette fonctionnalité arrive après le premier
            lancement.
          </p>
        </CardContent>
      </Card>

      {affiche ? <CarteBriefing affiche={affiche} /> : null}
    </div>
  );
}
