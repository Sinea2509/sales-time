import { randomBytes } from "node:crypto";
import { put } from "@vercel/blob";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const MIME_TO_EXT = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export function validateOrgLogoFile(
  file: File,
): { ok: true; ext: string } | { ok: false; message: string } {
  if (!file.size) {
    return { ok: false, message: "Fichier vide." };
  }
  if (file.size > MAX_LOGO_BYTES) {
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

export async function uploadOrgLogoToBlob(
  organizationId: string,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const validated = validateOrgLogoFile(file);
  if (!validated.ok) {
    return validated;
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return {
      ok: false,
      message:
        "Téléversement indisponible : configurez BLOB_READ_WRITE_TOKEN (stockage Vercel Blob).",
    };
  }
  const suffix = randomBytes(8).toString("hex");
  const pathname = `org-logos/${organizationId}/logo-${suffix}.${validated.ext}`;
  try {
    const blob = await put(pathname, file, {
      access: "public",
      token,
    });
    return { ok: true, url: blob.url };
  } catch (err) {
    console.error("uploadOrgLogoToBlob", err);
    return { ok: false, message: "Échec du téléversement. Réessayez." };
  }
}
