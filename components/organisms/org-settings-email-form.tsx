"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrganizationEmailSettings } from "@/app/[locale]/company/settings/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { nativeSelectClassName } from "@/components/ui/native-select-class";

export function OrgSettingsEmailForm({
  initialTone,
  initialVouvoiement,
  initialSignature,
}: {
  initialTone: "formal" | "informal" | null;
  initialVouvoiement: boolean;
  initialSignature: string | null;
}) {
  const router = useRouter();
  const [tone, setTone] = useState<"formal" | "informal">(
    initialTone === "informal" ? "informal" : "formal",
  );
  const [vouv, setVouv] = useState(initialVouvoiement);
  const [sig, setSig] = useState(initialSignature ?? "");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="max-w-xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        startTransition(async () => {
          const r = await updateOrganizationEmailSettings({
            emailTone: tone,
            emailVouvoiement: vouv,
            emailSignature: sig.trim() || null,
          });
          setMsg(
            r.ok
              ? { ok: true, text: "Enregistré." }
              : { ok: false, text: r.message },
          );
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email-tone">Ton des e-mails</Label>
        <select
          id="email-tone"
          className={cn(nativeSelectClassName, "max-w-md")}
          value={tone}
          onChange={(e) => setTone(e.target.value as "formal" | "informal")}
        >
          <option value="formal">Formel / soutenu</option>
          <option value="informal">Informel / direct</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="email-vouv"
          type="checkbox"
          checked={vouv}
          onChange={(e) => setVouv(e.target.checked)}
          className="size-4 rounded border"
        />
        <Label htmlFor="email-vouv" className="font-normal">
          Vouvoiement (« vous »)
        </Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-sig">Signature (texte)</Label>
        <Textarea
          id="email-sig"
          rows={5}
          value={sig}
          onChange={(e) => setSig(e.target.value)}
          placeholder="Ex. Cordialement,\nJean Dupont\nAccount Executive — …"
        />
      </div>
      {msg ? (
        <p
          className={cn(
            "text-sm",
            msg.ok ? "text-green-700 dark:text-green-400" : "text-destructive",
          )}
          role="status"
        >
          {msg.text}
        </p>
      ) : null}
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
