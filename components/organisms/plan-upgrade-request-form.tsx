"use client";

import { useState, useTransition } from "react";
import { submitPlanRequestAction } from "@/app/[locale]/company/plan-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { nativeSelectClassName } from "@/components/ui/native-select-class";
import {
  FORFAITS_PROPOSES,
  FORFAIT_INITIAL,
  ID_CHAMP_FORFAIT_SOUHAITE,
  ID_FORMULAIRE_DEMANDE,
  LONGUEUR_MAX_MESSAGE,
} from "@/lib/demande-de-forfait";

/*
  Un seul message, « Envoi impossible. », couvrait des causes qui n'appellent
  pas la même action : une session expirée se règle en se reconnectant, une
  organisation manquante en la sélectionnant, une panne réseau en réessayant.
  L'utilisateur relançait le même envoi sans savoir quoi corriger.

  « VALIDATION » n'a pas sa phrase : le sélecteur ne peut produire qu'une des
  trois valeurs attendues, et le champ message est borné à la longueur que le
  serveur accepte. Le code brut sert alors de repli honnête pour un cas qui ne
  devrait pas se produire, plutôt qu'une phrase écrite pour un état que
  personne ne peut atteindre depuis cet écran.
*/
function messageErreur(code: string): string {
  if (code === "UNAUTHENTICATED") {
    return "Votre session a expiré. Reconnectez-vous pour envoyer votre demande.";
  }
  if (code === "NO_ORG") {
    return "Aucune organisation active. Sélectionnez une organisation avant d'envoyer une demande.";
  }
  return `Envoi impossible (${code}).`;
}

export function PlanUpgradeRequestForm() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div
      id={ID_FORMULAIRE_DEMANDE}
      /*
        `scroll-mt` laisse la place de l'en-tête collant : sans cette marge, le
        lien d'une carte amène le titre du bloc sous la barre du haut, et le
        formulaire semble s'ouvrir sur son deuxième champ.
      */
      className="border-brand/30 bg-brand/5 scroll-mt-24 rounded-xl border p-5"
    >
      <h2 className="text-base font-semibold">Demander un upgrade</h2>
      {/*
        `text-muted-foreground` tient 4,74:1 sur du blanc, tout juste au-dessus
        du minimum. Ce panneau étant teinté en marque, il n'en restait que
        4,27:1, mesuré au navigateur. L'encre passe donc au même gris que la
        ligne secondaire des cartes de forfait, juste au-dessus.
      */}
      <p className="mt-1 text-sm text-foreground dark:text-neutral-300">
        Quota d&apos;essai épuisé ou besoin de la vue manager ? Envoyez une
        demande à notre équipe.
      </p>
      {done ? (
        <p
          role="status"
          className="mt-4 text-sm text-emerald-700 dark:text-emerald-400"
        >
          Demande envoyée. Notre équipe vous recontacte rapidement, et un accusé
          de réception part vers votre adresse.
        </p>
      ) : (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              /*
                L'action serveur écrit en base puis envoie deux e-mails : une
                coupure réseau la faisait échouer en promesse rejetée, le bouton
                reprenait son état normal et rien ne s'affichait. La demande
                paraissait partie.
              */
              try {
                const res = await submitPlanRequestAction({
                  desiredPlan: String(fd.get("desiredPlan") ?? ""),
                  message: String(fd.get("message") ?? ""),
                });
                if (!res.ok) {
                  setError(messageErreur(res.error));
                  return;
                }
                setDone(true);
              } catch {
                setError(
                  "L'envoi n'a pas abouti. Vérifiez votre connexion, puis réessayez.",
                );
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={ID_CHAMP_FORFAIT_SOUHAITE}>Forfait souhaité</Label>
            <select
              id={ID_CHAMP_FORFAIT_SOUHAITE}
              name="desiredPlan"
              className={nativeSelectClassName}
              defaultValue={FORFAIT_INITIAL}
            >
              {FORFAITS_PROPOSES.map((forfait) => (
                <option key={forfait} value={forfait}>
                  {forfait}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (optionnel)</Label>
            <Textarea
              id="message"
              name="message"
              rows={3}
              maxLength={LONGUEUR_MAX_MESSAGE}
            />
          </div>
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={pending}
            data-feedback-id="plan-upgrade-submit"
          >
            {pending ? "Envoi…" : "Envoyer la demande"}
          </Button>
        </form>
      )}
    </div>
  );
}
