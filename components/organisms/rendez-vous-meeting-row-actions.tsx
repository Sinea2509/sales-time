"use client";

import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { Eye, MoreHorizontal, Pencil, Sparkles, Trash2 } from "lucide-react";
import {
  deleteMeetingAction,
  getMeetingForEditAction,
  getOrgMeetingFormOptionsAction,
  type MeetingEditPayload,
} from "@/app/[locale]/company/rendez-vous/actions";
import { MeetingEditDialog } from "@/components/organisms/meeting-edit-dialog";
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
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);
  const [editMeeting, setEditMeeting] = useState<MeetingEditPayload | null>(
    null,
  );
  const [formOptions, setFormOptions] = useState({
    meetingTypeOptions: [] as string[],
    pipelineStageOptions: [] as string[],
  });

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

  async function openEditDialog() {
    setEditOpen(true);
    setEditLoading(true);
    setEditLoadError(null);
    setEditMeeting(null);

    const [meetingRes, optionsRes] = await Promise.all([
      getMeetingForEditAction(meetingId),
      getOrgMeetingFormOptionsAction(),
    ]);

    if (!meetingRes.ok) {
      setEditLoadError(
        meetingRes.error === "FORBIDDEN"
          ? "Vous n'avez pas le droit de modifier ce rendez-vous."
          : "Impossible de charger ce rendez-vous.",
      );
    } else {
      setEditMeeting(meetingRes.meeting);
    }

    if (optionsRes.ok) {
      setFormOptions({
        meetingTypeOptions: optionsRes.meetingTypeOptions,
        pipelineStageOptions: optionsRes.pipelineStageOptions,
      });
    }

    setEditLoading(false);
  }

  function closeEditDialog() {
    setEditOpen(false);
    setEditLoadError(null);
    setEditMeeting(null);
  }

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
          <DropdownMenuItem onClick={() => void openEditDialog()}>
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

      <MeetingEditDialog
        prospectName={prospectName}
        open={editOpen}
        loading={editLoading}
        loadError={editLoadError}
        meeting={editMeeting}
        formOptions={formOptions}
        onOpenChange={(next) => {
          if (!next) closeEditDialog();
          else void openEditDialog();
        }}
      />
    </>
  );
}
