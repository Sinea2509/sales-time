"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Building2, Mail, Sparkles, Users } from "lucide-react";
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

const STEPS = [
  { id: 1, label: "Contexte", icon: Building2 },
  { id: 2, label: "Coach IA", icon: Sparkles },
  { id: 3, label: "Process", icon: Users },
  { id: 4, label: "Invitations", icon: Mail },
] as const;

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
  inviteEmails: string[];
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

  const [inviteEmails, setInviteEmails] = useState<string[]>(
    initial.inviteEmails.length > 0
      ? initial.inviteEmails
      : ["", "", ""],
  );
  const [inviteMessage, setInviteMessage] = useState(initial.inviteMessage);

  const [draftObjection, setDraftObjection] = useState("");
  const [draftArgument, setDraftArgument] = useState("");
  const [draftMeeting, setDraftMeeting] = useState("");
  const [draftStage, setDraftStage] = useState("");

  const pitchLen = companyPitch.length;
  const vocabLen = industryVocabulary.length;
  const inviteLen = inviteMessage.length;

  const stepper = useMemo(
    () =>
      STEPS.map((s) => ({
        ...s,
        active: s.id === step,
        done: s.id < step,
      })),
    [step],
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
        const emails = inviteEmails
          .map((e) => e.trim())
          .filter((e) => e.length > 0);
        await submitOnboardingStep4({
          inviteEmails: emails,
          inviteMessage: inviteMessage || null,
        });
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
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Personnalisons votre coach
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Configuration admin
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Parcours en 4 étapes, d’après votre maquette — contexte entreprise,
            coach IA, processus commercial, invitations équipe.
          </p>

          <ol className="mt-8 flex flex-wrap gap-2 sm:gap-3" aria-label="Étapes">
            {stepper.map(({ id, label, icon: Icon, active, done }) => (
              <li key={id}>
                <div
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:text-sm ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : done
                        ? "border-border bg-muted text-muted-foreground"
                        : "border-border text-muted-foreground bg-background"
                  }`}
                >
                  <span className="tabular-nums">{id}</span>
                  <Icon className="size-3.5 opacity-80 sm:size-4" aria-hidden />
                  <span className="hidden sm:inline">{label}</span>
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
                Nom de l’entreprise, secteur, taille d’équipe, cycle et ticket
                moyens.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de l’entreprise</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme SAS"
                  autoComplete="organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Secteur d’activité</Label>
                <Input
                  id="industry"
                  value={industrySector}
                  onChange={(e) => setIndustrySector(e.target.value)}
                  placeholder="SaaS B2B, industrie…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamSize">
                  Taille de l’équipe commerciale
                </Label>
                <Input
                  id="teamSize"
                  value={commercialTeamSize}
                  onChange={(e) => setCommercialTeamSize(e.target.value)}
                  placeholder="ex. 5–10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycle">Cycle de vente moyen</Label>
                <Input
                  id="cycle"
                  value={averageSalesCycle}
                  onChange={(e) => setAverageSalesCycle(e.target.value)}
                  placeholder="ex. 45 jours"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket">Ticket moyen</Label>
                <Input
                  id="ticket"
                  value={averageDealSize}
                  onChange={(e) => setAverageDealSize(e.target.value)}
                  placeholder="ex. 15 000 €"
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coach IA</CardTitle>
              <p className="text-muted-foreground text-sm">
                Pitch, objections, arguments et vocabulaire métier.
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
                  placeholder="Ce que vous vendez, à qui, et quel problème vous résolvez."
                />
              </div>

              <div className="space-y-2">
                <Label>Objections principales</Label>
                <p className="text-muted-foreground text-xs">
                  Ex. « C’est trop cher », « On a déjà un prestataire »…
                </p>
                <ul className="space-y-2">
                  {objections.map((o, i) => (
                    <li
                      key={`${i}-${o.slice(0, 8)}`}
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
                <div className="flex gap-2">
                  <Input
                    value={draftObjection}
                    onChange={(e) => setDraftObjection(e.target.value)}
                    placeholder="Ajouter une objection"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const v = draftObjection.trim();
                      if (!v) return;
                      setObjections((xs) => [...xs, v]);
                      setDraftObjection("");
                    }}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Arguments clés &amp; différenciateurs</Label>
                <p className="text-muted-foreground text-xs">
                  ROI, livraison, garanties…
                </p>
                <ul className="space-y-2">
                  {keyArguments.map((o, i) => (
                    <li
                      key={`${i}-${o.slice(0, 8)}`}
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
                <div className="flex gap-2">
                  <Input
                    value={draftArgument}
                    onChange={(e) => setDraftArgument(e.target.value)}
                    placeholder="Ajouter un argument"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const v = draftArgument.trim();
                      if (!v) return;
                      setKeyArguments((xs) => [...xs, v]);
                      setDraftArgument("");
                    }}
                  >
                    Ajouter
                  </Button>
                </div>
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
                Types de rendez-vous et étapes du pipeline.
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <Label>Type de RDV</Label>
                <ul className="space-y-2">
                  {meetingTypes.map((o, i) => (
                    <li key={`${i}-${o}`} className="flex gap-2 text-sm">
                      <span className="border-border flex-1 rounded-md border px-3 py-2">
                        {o}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setMeetingTypes((xs) => xs.filter((_, j) => j !== i))
                        }
                      >
                        Retirer
                      </Button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Input
                    value={draftMeeting}
                    onChange={(e) => setDraftMeeting(e.target.value)}
                    placeholder="Ajouter un type"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const v = draftMeeting.trim();
                      if (!v) return;
                      setMeetingTypes((xs) => [...xs, v]);
                      setDraftMeeting("");
                    }}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Étapes du pipeline</Label>
                <ul className="space-y-2">
                  {pipelineStages.map((o, i) => (
                    <li key={`${i}-${o}`} className="flex gap-2 text-sm">
                      <span className="border-border flex-1 rounded-md border px-3 py-2">
                        {o}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setPipelineStages((xs) =>
                            xs.filter((_, j) => j !== i),
                          )
                        }
                      >
                        Retirer
                      </Button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Input
                    value={draftStage}
                    onChange={(e) => setDraftStage(e.target.value)}
                    placeholder="Ajouter une étape"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const v = draftStage.trim();
                      if (!v) return;
                      setPipelineStages((xs) => [...xs, v]);
                      setDraftStage("");
                    }}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === 4 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invitations</CardTitle>
              <p className="text-muted-foreground text-sm">
                Invitez votre équipe — e-mails et message d’invitation.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Adresses e-mail</Label>
                {inviteEmails.map((em, i) => (
                  <Input
                    key={i}
                    type="email"
                    value={em}
                    onChange={(e) => {
                      const v = e.target.value;
                      setInviteEmails((xs) => {
                        const next = [...xs];
                        next[i] = v;
                        return next;
                      });
                    }}
                    placeholder="collegue@entreprise.com"
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInviteEmails((xs) => [...xs, ""])}
                >
                  Ajouter une invitation
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="inviteMsg">Message d’invitation</Label>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {inviteLen}/500
                  </span>
                </div>
                <Textarea
                  id="inviteMsg"
                  value={inviteMessage}
                  onChange={(e) =>
                    setInviteMessage(e.target.value.slice(0, 500))
                  }
                  rows={6}
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
          <Button type="button" onClick={goNext} disabled={pending}>
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
      </div>
    </div>
  );
}
