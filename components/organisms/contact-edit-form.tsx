"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateContactAction } from "@/app/[locale]/company/contacts/actions";
import type { ContactSummaryRow } from "@/src/core/ports/contact-repository-port";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ContactEditForm({
  contact,
  variant = "page",
  onSuccess,
  onCancel,
}: {
  contact: ContactSummaryRow;
  variant?: "page" | "dialog";
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const isDialog = variant === "dialog";

  return (
    <form
      className={cn("space-y-4", !isDialog && "max-w-xl")}
      action={(fd) => {
        setMessage(null);
        startTransition(async () => {
          const r = await updateContactAction(contact.id, {
            displayName: String(fd.get("displayName") ?? ""),
            company: String(fd.get("company") ?? "") || null,
            email: String(fd.get("email") ?? "") || null,
            phone: String(fd.get("phone") ?? "") || null,
            jobTitle: String(fd.get("jobTitle") ?? "") || null,
            notes: String(fd.get("notes") ?? "") || null,
          });
          if (!r.ok) {
            setMessage(
              "Enregistrement impossible. Vérifiez les champs ou le nom dupliqué.",
            );
            return;
          }
          if (onSuccess) {
            onSuccess();
            return;
          }
          setMessage("Enregistré.");
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="displayName">Nom complet *</Label>
        <Input
          id="displayName"
          name="displayName"
          required
          maxLength={200}
          defaultValue={contact.displayName}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company">Société</Label>
          <Input
            id="company"
            name="company"
            maxLength={200}
            defaultValue={contact.company ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobTitle">Fonction</Label>
          <Input
            id="jobTitle"
            name="jobTitle"
            maxLength={200}
            defaultValue={contact.jobTitle ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            maxLength={320}
            defaultValue={contact.email ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            name="phone"
            maxLength={80}
            defaultValue={contact.phone ?? ""}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={20_000}
          defaultValue={contact.notes ?? ""}
        />
      </div>
      {message ? (
        <p
          className={
            message.startsWith("Enregistré")
              ? "text-sm text-green-700 dark:text-green-400"
              : "text-destructive text-sm"
          }
          role="status"
        >
          {message}
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
            className="bg-brand text-white hover:bg-brand-hover"
          >
            {pending ? "Enregistrement…" : "Mettre à jour"}
          </Button>
        </DialogFooter>
      ) : (
        <Button
          type="submit"
          disabled={pending}
          className="bg-brand text-white hover:bg-brand-hover"
        >
          {pending ? "Enregistrement…" : "Mettre à jour"}
        </Button>
      )}
    </form>
  );
}
