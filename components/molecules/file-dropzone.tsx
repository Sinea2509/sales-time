"use client";

import { FileText, UploadCloud, X } from "lucide-react";
import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { fileMatchesAccept } from "@/lib/file-accept";
import { cn } from "@/lib/utils";

type FileDropzoneProps = {
  id?: string;
  accept: string;
  maxBytes: number;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  /** Human-readable hint shown under the prompt (e.g. accepted formats). */
  hint?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} o`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function FileDropzone({
  id,
  accept,
  maxBytes,
  file,
  onFileChange,
  disabled,
  hint,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateAndSet(next: File | null) {
    setError(null);
    if (!next) {
      onFileChange(null);
      return;
    }
    if (!fileMatchesAccept(next.name, next.type, accept)) {
      setError("Format non pris en charge.");
      onFileChange(null);
      return;
    }
    if (next.size > maxBytes) {
      setError(`Fichier trop volumineux (max. ${formatBytes(maxBytes)}).`);
      onFileChange(null);
      return;
    }
    onFileChange(next);
  }

  function openPicker() {
    if (!disabled) {
      inputRef.current?.click();
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) {
      return;
    }
    validateAndSet(event.dataTransfer.files?.[0] ?? null);
  }

  function clearFile() {
    validateAndSet(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setDragging(true);
          }
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-transparent px-4 py-6 text-center transition-colors outline-none focus-visible:border-brand",
          dragging && "border-brand bg-brand/5",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-brand/60",
        )}
      >
        {file ? (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="size-5 text-brand" aria-hidden />
            <span className="font-medium break-all">{file.name}</span>
            <span className="text-muted-foreground text-xs">
              {formatBytes(file.size)}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                clearFile();
              }}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Retirer le fichier"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm">
              <span className="font-medium text-brand">Choisir un fichier</span>{" "}
              ou glisser-déposer
            </p>
            {hint ? (
              <p className="text-muted-foreground text-xs">{hint}</p>
            ) : null}
          </>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={(event) => validateAndSet(event.target.files?.[0] ?? null)}
        />
      </div>
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
