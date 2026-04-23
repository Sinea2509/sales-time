"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOrganizationCoach } from "@/app/[locale]/company/settings/actions";
import { cn } from "@/lib/utils";

function linesToArray(s: string, max: number, maxLineLen: number): string[] {
  const out: string[] = [];
  for (const line of s.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    out.push(t.slice(0, maxLineLen));
    if (out.length >= max) break;
  }
  return out;
}

export type OrgCoachFormInitial = {
  companyPitch: string;
  objections: string[];
  keyArguments: string[];
  industryVocabulary: string;
};

export function OrgSettingsCoachForm({ initial }: { initial: OrgCoachFormInitial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  const [companyPitch, setCompanyPitch] = useState(initial.companyPitch);
  const [objectionsText, setObjectionsText] = useState(
    initial.objections.join("\n"),
  );
  const [argumentsText, setArgumentsText] = useState(
    initial.keyArguments.join("\n"),
  );
  const [industryVocabulary, setIndustryVocabulary] = useState(
    initial.industryVocabulary,
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const objections = linesToArray(objectionsText, 30, 300);
      const keyArguments = linesToArray(argumentsText, 30, 400);
      const r = await updateOrganizationCoach({
        companyPitch: companyPitch.trim() || null,
        objections,
        keyArguments,
        industryVocabulary: industryVocabulary.trim() || null,
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
    <form onSubmit={onSubmit} className="space-y-6">
      {message ? (
        <p
          className={cn(
            "text-sm",
            message.type === "ok" ? "text-green-700 dark:text-green-400" : "text-destructive",
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="org-pitch">Pitch entreprise</Label>
          <span className="text-muted-foreground text-xs tabular-nums">
            {companyPitch.length}/500
          </span>
        </div>
        <Textarea
          id="org-pitch"
          value={companyPitch}
          onChange={(e) => setCompanyPitch(e.target.value.slice(0, 500))}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-obj">Objections (une par ligne)</Label>
        <Textarea
          id="org-obj"
          value={objectionsText}
          onChange={(e) => setObjectionsText(e.target.value)}
          rows={5}
          placeholder={"Prix trop élevé\nPas le bon moment"}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-args">Arguments clés (un par ligne)</Label>
        <Textarea
          id="org-args"
          value={argumentsText}
          onChange={(e) => setArgumentsText(e.target.value)}
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="org-vocab">Vocabulaire métier</Label>
          <span className="text-muted-foreground text-xs tabular-nums">
            {industryVocabulary.length}/500
          </span>
        </div>
        <Textarea
          id="org-vocab"
          value={industryVocabulary}
          onChange={(e) =>
            setIndustryVocabulary(e.target.value.slice(0, 500))
          }
          rows={3}
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="bg-brand text-white hover:bg-brand-hover"
      >
        Enregistrer
      </Button>
    </form>
  );
}
