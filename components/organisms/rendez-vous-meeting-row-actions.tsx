"use client";

import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { Eye, MoreHorizontal, Pencil, Sparkles, Trash2 } from "lucide-react";
import { deleteMeetingAction } from "@/app/[locale]/company/rendez-vous/actions";
import {
  MeetingEditDialogHost,
  useMeetingEditDialog,
} from "@/components/organisms/meeting-edit-trigger";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function RendezVousMeetingRowActions({
  meetingId,
  prospectName,
}: {
  meetingId: string;
  prospectName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const edit = useMeetingEditDialog(meetingId);

  const handleDelete = () => {
    if (pending) return;
    const confirmed = window.confirm(
      `Supprimer définitivement le rendez-vous « ${prospectName} » ? Cette action est irréversible.`,
    );
    if (!confirmed) return;
    startTransition(async () => {
      const res = await deleteMeetingAction(meetingId);
      if (!res.ok) {
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
          aria-label={`Actions — ${prospectName}`}
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
            onClick={() => router.push(`/company/rendez-vous/${meetingId}`)}
          >
            <Eye className="size-4" />
            Ouvrir
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void edit.openEditDialog()}>
            <Pencil className="size-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              router.push(`/company/rendez-vous/${meetingId}#analyse`)
            }
          >
            <Sparkles className="size-4" />
            Analyser
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

      <MeetingEditDialogHost prospectName={prospectName} edit={edit} />
    </>
  );
}
