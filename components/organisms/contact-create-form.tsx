"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createContactAction } from "@/app/[locale]/company/contacts/actions";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ContactCreateFormProps = {
  variant?: "page" | "dialog";
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
};

export function ContactCreateForm({
  variant = "page",
  onSuccess,
  onCancel,
}: ContactCreateFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isDialog = variant === "dialog";

  return (
    <form
      className={cn("space-y-4", !isDialog && "max-w-xl")}
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
          if (onSuccess) {
            onSuccess(r.id);
          } else {
            router.push(`/company/contacts/${r.id}`);
            router.refresh();
          }
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
      {isDialog ? (
        <DialogFooter className="-mx-4 -mb-4 mt-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={pending}
            className="bg-brand text-brand-foreground hover:bg-brand-hover"
          >
            {pending ? "Enregistrement…" : "Créer le contact"}
          </Button>
        </DialogFooter>
      ) : (
        <Button
          type="submit"
          disabled={pending}
          className="bg-brand text-brand-foreground hover:bg-brand-hover"
        >
          {pending ? "Enregistrement…" : "Créer le contact"}
        </Button>
      )}
    </form>
  );
}
