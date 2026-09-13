"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KissQuadrantPromptsFields } from "@/components/molecules/kiss-quadrant-prompts-fields";
import { saveGlobalKissConsignesAction } from "@/app/[locale]/admin/prompts/kiss-consignes/actions";
import {
  emptyKissCoachingPromptsForm,
  kissCoachingPromptsFromJson,
  type KissCoachingPromptsForm,
} from "@/src/core/domain/kiss-org-coaching-prompts";
import { cn } from "@/lib/utils";

type Props = {
  initialJson: unknown | null;
};

export function SuperAdminKissConsignesEditor({ initialJson }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [form, setForm] = useState<KissCoachingPromptsForm>(() =>
    kissCoachingPromptsFromJson(initialJson ?? undefined),
  );

  return (
    <div className="space-y-6">
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

      <KissQuadrantPromptsFields
        value={form}
        onChange={setForm}
        description={
          <>
            <p>
              Ces textes enrichissent le prompt d’analyse KISS sur les
              rendez-vous (priorité aux consignes « commercial ») et les
              synthèses manager (tableau de bord équipe et fiche commercial :
              consignes « manager »). Les consignes « global » s’appliquent dans
              les deux cas.
            </p>
            <p className="mt-2">Laissez vide ce qui ne sert pas.</p>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              const r = await saveGlobalKissConsignesAction(form);
              if (!r.ok) {
                setMessage({
                  type: "err",
                  text:
                    r.error === "SAVE_FAILED" && r.message
                      ? r.message
                      : r.error === "NOT_SUPER_ADMIN"
                        ? "Accès réservé aux super administrateurs."
                        : "Enregistrement impossible.",
                });
                return;
              }
              setMessage({ type: "ok", text: "Enregistré." });
              router.refresh();
            });
          }}
          className="bg-brand text-brand-foreground hover:bg-brand-hover"
        >
          Enregistrer
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            setForm(emptyKissCoachingPromptsForm());
            setMessage(null);
          }}
        >
          Tout vider (formulaire)
        </Button>
      </div>
    </div>
  );
}
