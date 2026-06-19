import { randomBytes } from "node:crypto";
import { put } from "@vercel/blob";
import { blobPutOptions, resolveBlobPutAuth } from "@/lib/blob-config";
import { buildUserBlobPath } from "@/lib/blob-paths";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const MIME_TO_EXT = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export function validateUserAvatarFile(
  file: File,
): { ok: true; ext: string } | { ok: false; message: string } {
  if (!file.size) {
    return { ok: false, message: "Fichier vide." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, message: "Image trop volumineuse (max. 2 Mo)." };
  }
  const ext = MIME_TO_EXT.get(file.type);
  if (!ext) {
    return {
      ok: false,
      message: "Format non pris en charge (PNG, JPEG, WebP ou GIF).",
    };
  }
  return { ok: true, ext };
}

export async function uploadUserAvatarToBlob(
  userId: string,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const validated = validateUserAvatarFile(file);
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
  const pathname = buildUserBlobPath(
    userId,
    "avatars",
    `avatar-${suffix}.${validated.ext}`,
  );

  try {
    const blob = await put(pathname, file, blobPutOptions(auth, { addRandomSuffix: true }));
    return { ok: true, url: blob.url };
  } catch (err) {
    console.error("uploadUserAvatarToBlob", err);
    return { ok: false, message: "Échec du téléversement. Réessayez." };
  }
}
