import { randomBytes } from "node:crypto";
import { put } from "@vercel/blob";
import { blobPutOptions, resolveBlobPutAuth } from "@/lib/blob-config";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const IMAGE_MIME_TO_EXT = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export type ImageFileValidation =
  | { ok: true; ext: string }
  | { ok: false; message: string };

/** Shared size/MIME guard for user-uploaded images (logos, avatars). */
export function validateImageFile(file: File): ImageFileValidation {
  if (!file.size) {
    return { ok: false, message: "Fichier vide." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "Image trop volumineuse (max. 2 Mo)." };
  }
  const ext = IMAGE_MIME_TO_EXT.get(file.type);
  if (!ext) {
    return {
      ok: false,
      message: "Format non pris en charge (PNG, JPEG, WebP ou GIF).",
    };
  }
  return { ok: true, ext };
}

export type ImageUploadResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

/**
 * Validates an image then uploads it to Vercel Blob. Callers own the storage
 * layout via `buildPathname`, which receives the validated extension and a
 * random suffix.
 */
export async function uploadImageToBlob(input: {
  file: File;
  buildPathname: (ext: string, suffix: string) => string;
  logLabel: string;
}): Promise<ImageUploadResult> {
  const validated = validateImageFile(input.file);
  if (!validated.ok) {
    return validated;
  }

  const auth = resolveBlobPutAuth();
  if (!auth) {
    return {
      ok: false,
      message:
        "Téléversement indisponible : configurez le stockage Vercel Blob.",
    };
  }

  const suffix = randomBytes(8).toString("hex");
  const pathname = input.buildPathname(validated.ext, suffix);

  try {
    const blob = await put(
      pathname,
      input.file,
      blobPutOptions(auth, { addRandomSuffix: true }),
    );
    return { ok: true, url: blob.url };
  } catch (err) {
    console.error(input.logLabel, err);
    const message =
      err instanceof Error && err.message.trim().length > 0
        ? err.message
        : "Erreur réseau ou serveur.";
    return {
      ok: false,
      message: `Échec du téléversement : ${message}`,
    };
  }
}
