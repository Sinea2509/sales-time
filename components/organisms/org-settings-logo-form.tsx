"use client";

import { useId, useState, useTransition } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  removeOrganizationLogo,
  uploadOrganizationLogo,
} from "@/app/[locale]/company/settings/actions";
import { cn } from "@/lib/utils";

export function OrgSettingsLogoForm({
  initialLogoUrl,
  canEdit = true,
}: {
  initialLogoUrl: string | null;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const inputId = useId();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMessage(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("logo", file);
      const r = await uploadOrganizationLogo(fd);
      if (!r.ok) {
        setMessage({ type: "err", text: r.message });
        return;
      }
      setMessage({ type: "ok", text: "Logo enregistré." });
      router.refresh();
    });
  }

  function onRemove() {
    if (!canEdit) return;
    setMessage(null);
    startTransition(async () => {
      const r = await removeOrganizationLogo();
      if (!r.ok) {
        setMessage({ type: "err", text: r.message });
        return;
      }
      setMessage({ type: "ok", text: "Logo supprimé." });
      router.refresh();
    });
  }

  return (
    <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto">
      {message ? (
        <p
          className={cn(
            "text-sm",
            message.type === "ok"
              ? "text-green-700 dark:text-green-400"
              : "text-destructive",
          )}
          role="status"
        >
          {message.text}
        </p>
      ) : null}
      <div className="flex flex-col items-start gap-2">
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="peer sr-only"
          aria-label="Téléverser ou remplacer le logo de l’entreprise"
          disabled={pending || !canEdit}
          onChange={onFileChange}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "relative flex size-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border transition-[opacity,box-shadow,background-color] sm:size-44",
            initialLogoUrl
              ? "border-border bg-muted hover:bg-muted/80"
              : "border-muted-foreground/20 border-dashed bg-muted/20 hover:border-muted-foreground/35 hover:bg-muted/40",
            (pending || !canEdit) && "pointer-events-none opacity-60",
            canEdit &&
              "peer-focus-visible:ring-ring peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
            canEdit ? "cursor-pointer" : "cursor-default",
          )}
        >
          {pending ? (
            <span className="bg-background/80 absolute inset-0 flex items-center justify-center rounded-[inherit]">
              <Loader2 className="text-muted-foreground size-7 animate-spin" />
            </span>
          ) : null}
          {initialLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote blob URL
            <img
              src={initialLogoUrl}
              alt=""
              className="max-h-full max-w-full object-contain p-1.5"
            />
          ) : (
            <span className="text-muted-foreground flex flex-col items-center gap-2 px-3 text-center text-xs leading-tight">
              <ImagePlus className="size-9 opacity-70" aria-hidden />
              <span>Cliquer pour téléverser</span>
            </span>
          )}
        </label>
        {initialLogoUrl && canEdit ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="text-muted-foreground hover:text-destructive h-auto px-0 py-0 text-xs"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
          >
            Supprimer le logo
          </Button>
        ) : null}
      </div>
    </div>
  );
}
