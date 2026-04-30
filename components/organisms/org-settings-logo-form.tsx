"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  removeOrganizationLogo,
  uploadOrganizationLogo,
} from "@/app/[locale]/company/settings/actions";
import { cn } from "@/lib/utils";

export function OrgSettingsLogoForm({
  initialLogoUrl,
}: {
  initialLogoUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    <div className="border-border bg-card space-y-3 rounded-lg border p-4">
      <div>
        <Label>Logo de l&apos;organisation</Label>
        <p className="text-muted-foreground mt-1 text-xs">
          PNG, JPEG, WebP ou GIF — max. 2 Mo. Nécessite Vercel Blob
          (BLOB_READ_WRITE_TOKEN).
        </p>
      </div>
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
      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-muted border-border flex size-20 items-center justify-center overflow-hidden rounded-lg border">
          {initialLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote blob URL
            <img
              src={initialLogoUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="text-muted-foreground text-xs">Aucun</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={onFileChange}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {initialLogoUrl ? "Remplacer…" : "Ajouter un logo…"}
          </Button>
          {initialLogoUrl ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onRemove}
            >
              Supprimer
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
