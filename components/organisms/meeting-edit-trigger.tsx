"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil } from "lucide-react";
import {
  getMeetingForEditAction,
  getOrgMeetingFormOptionsAction,
  type MeetingEditPayload,
} from "@/app/[locale]/company/rendez-vous/actions";
import { MeetingEditDialog } from "@/components/organisms/meeting-edit-dialog";
import { Button } from "@/components/ui/button";

type FormOptions = {
  meetingTypeOptions: string[];
  pipelineStageOptions: string[];
};

export function useMeetingEditDialog(meetingId: string) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editLoadError, setEditLoadError] = useState<string | null>(null);
  const [editMeeting, setEditMeeting] = useState<MeetingEditPayload | null>(
    null,
  );
  const [formOptions, setFormOptions] = useState<FormOptions>({
    meetingTypeOptions: [],
    pipelineStageOptions: [],
  });

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

  return {
    editOpen,
    editLoading,
    editLoadError,
    editMeeting,
    formOptions,
    openEditDialog,
    closeEditDialog,
    onEditOpenChange: (next: boolean) => {
      if (!next) closeEditDialog();
      else void openEditDialog();
    },
    onEditSuccess: () => {
      closeEditDialog();
      router.refresh();
    },
  };
}

export function MeetingEditDialogHost({
  prospectName,
  edit,
}: {
  prospectName: string;
  edit: ReturnType<typeof useMeetingEditDialog>;
}) {
  return (
    <MeetingEditDialog
      prospectName={prospectName}
      open={edit.editOpen}
      loading={edit.editLoading}
      loadError={edit.editLoadError}
      meeting={edit.editMeeting}
      formOptions={edit.formOptions}
      onOpenChange={edit.onEditOpenChange}
      onSuccess={edit.onEditSuccess}
    />
  );
}

export function MeetingEditButton({
  meetingId,
  prospectName,
  variant = "outline",
  size = "sm",
}: {
  meetingId: string;
  prospectName: string;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default";
}) {
  const edit = useMeetingEditDialog(meetingId);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => void edit.openEditDialog()}
      >
        <Pencil className="size-4" />
        Modifier
      </Button>
      <MeetingEditDialogHost prospectName={prospectName} edit={edit} />
    </>
  );
}
