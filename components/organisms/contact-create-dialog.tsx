"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ContactCreateForm } from "@/components/organisms/contact-create-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ContactCreateDialogProps = {
  defaultOpen?: boolean;
};

export function ContactCreateDialog({
  defaultOpen = false,
}: ContactCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);

  function closeDialog() {
    setOpen(false);
    if (defaultOpen) {
      router.replace("/company/contacts");
    }
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-brand text-brand-foreground hover:bg-brand-hover inline-flex h-9 w-fit shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium"
      >
        <Plus className="size-4 shrink-0" aria-hidden />
        Nouveau contact
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeDialog();
          else setOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nouveau contact</DialogTitle>
            <DialogDescription>
              Ajoutez un prospect ou un interlocuteur à votre base.
            </DialogDescription>
          </DialogHeader>
          <ContactCreateForm
            variant="dialog"
            onCancel={closeDialog}
            onSuccess={(id) => {
              closeDialog();
              router.push(`/company/contacts/${id}`);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
