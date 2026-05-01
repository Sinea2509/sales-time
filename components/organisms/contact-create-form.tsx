"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createContactAction } from "@/app/[locale]/company/contacts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="max-w-xl space-y-4"
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const r = await createContactAction({
            displayName: String(fd.get("displayName") ?? ""),
            company: String(fd.get("company") ?? "") || null,
            email: String(fd.get("email") ?? "") || null,
            phone: String(fd.get("phone") ?? "") || null,
            jobTitle: String(fd.get("jobTitle") ?? "") || null,
            notes: String(fd.get("notes") ?? "") || null,
          });
          if (!r.ok) {
            if (r.error === "DUPLICATE") {
              setError(
                "Un contact avec ce nom existe déjà dans votre organisation.",
              );
            } else {
              setError("Impossible d’enregistrer. Vérifiez les champs.");
            }
            return;
          }
          router.push(`/company/contacts/${r.id}`);
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="displayName">Nom complet *</Label>
        <Input id="displayName" name="displayName" required maxLength={200} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company">Société</Label>
          <Input id="company" name="company" maxLength={200} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Fonction</Label>
          <Input id="jobTitle" name="jobTitle" maxLength={200} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" maxLength={320} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" maxLength={80} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} maxLength={20_000} />
      </div>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="bg-brand text-white hover:bg-brand-hover"
      >
        {pending ? "Enregistrement…" : "Créer le contact"}
      </Button>
    </form>
  );
}
