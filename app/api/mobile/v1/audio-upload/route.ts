import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { z } from "zod";
import {
  AUDIO_ALLOWED_CONTENT_TYPES,
  AUDIO_MAX_BYTES,
} from "@/lib/audio-transcript";
import { resolveBlobPutAuth } from "@/lib/blob-config";
import { buildOrgBlobPath, sanitizeBlobFilename } from "@/lib/blob-paths";
import {
  mobileError,
  mobileJson,
  requireMobileOrgActor,
} from "@/lib/mobile/mobile-request";

export const dynamic = "force-dynamic";

/*
  La version du protocole de dépôt de Vercel Blob attendue par
  @vercel/blob 1.x. Le téléphone la reçoit d'ici plutôt que de la figer
  dans l'application : une mise à jour de la bibliothèque se répercute sans
  republier l'application.
*/
const BLOB_API_URL = "https://vercel.com/api/blob";
const BLOB_API_VERSION = "11";

/* Une heure de marge : un dépôt sur un réseau lent ne doit pas expirer en route. */
const TOKEN_VALIDITY_MS = 60 * 60 * 1000;

const requestSchema = z.object({
  filename: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().min(1),
});

/**
 * L'autorisation de déposer un enregistrement, que le téléphone envoie
 * ensuite directement au stockage, sans passer par le serveur (une requête
 * vers le serveur est plafonnée à quelques mégaoctets).
 *
 * Comme pour le navigateur, le jeton ne vaut que pour le dossier audio de
 * l'organisation, pour de l'audio, et sous la taille que le modèle accepte.
 * Le fichier trop lourd est refusé ici, avant d'avoir voyagé.
 */
export async function POST(request: Request) {
  const actor = await requireMobileOrgActor(request);
  if (!actor.ok) return mobileError(actor.error);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return mobileError("VALIDATION");
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return mobileError("VALIDATION");
  if (parsed.data.sizeBytes > AUDIO_MAX_BYTES) {
    return mobileError("AUDIO_TOO_LARGE");
  }

  const auth = resolveBlobPutAuth();
  if (!auth || !("token" in auth)) return mobileError("STORAGE_NOT_CONFIGURED");

  const pathname = buildOrgBlobPath(
    actor.organizationId,
    "meetings/audio",
    `${Date.now()}-${sanitizeBlobFilename(parsed.data.filename)}`,
  );
  const clientToken = await generateClientTokenFromReadWriteToken({
    token: auth.token,
    pathname,
    allowedContentTypes: AUDIO_ALLOWED_CONTENT_TYPES,
    maximumSizeInBytes: AUDIO_MAX_BYTES,
    addRandomSuffix: true,
    validUntil: Date.now() + TOKEN_VALIDITY_MS,
  });

  return mobileJson({
    pathname,
    clientToken,
    uploadUrl: `${BLOB_API_URL}/?${new URLSearchParams({ pathname })}`,
    apiVersion: BLOB_API_VERSION,
    maxBytes: AUDIO_MAX_BYTES,
  });
}
