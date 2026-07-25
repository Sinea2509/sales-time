"use client";

import { useState, useTransition } from "react";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { deleteContactAction } from "@/app/[locale]/company/contacts/actions";
import { ContactEditForm } from "@/components/organisms/contact-edit-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ContactSummaryRow } from "@/src/core/ports/contact-repository-port";

export function ContactRowActions({ contact }: { contact: ContactSummaryRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = () => {
    if (pending) return;
    const confirmed = window.confirm(
      `Supprimer définitivement le contact « ${contact.displayName} » ? Cette action est irréversible.`,
    );
    if (!confirmed) return;
    startTransition(async () => {
      const res = await deleteContactAction(contact.id);
      if (!res.ok) {
        if (res.error === "HAS_MEETINGS") {
          window.alert(
            "Impossible de supprimer ce contact : des rendez-vous y sont encore liés.",
          );
          return;
        }
        window.alert("La suppression a échoué.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions sur ${contact.displayName}`}
          disabled={pending}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "text-muted-foreground hover:text-foreground disabled:opacity-50",
          )}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => router.push(`/company/contacts/${contact.id}`)}
          >
            <Eye className="size-4" />
            Ouvrir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifier le contact</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de {contact.displayName}.
            </DialogDescription>
          </DialogHeader>
          <ContactEditForm
            contact={contact}
            variant="dialog"
            onCancel={() => setEditOpen(false)}
            onSuccess={() => {
              setEditOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
