import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getApplicationDeps } from "@/lib/application-deps";
import {
  AUDIO_ALLOWED_CONTENT_TYPES,
  AUDIO_MAX_BYTES,
} from "@/lib/audio-transcript";
import { resolveBlobPutAuth } from "@/lib/blob-config";
import { buildOrgBlobPath } from "@/lib/blob-paths";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";

export const dynamic = "force-dynamic";

/**
 * Le jeton qui autorise le navigateur à déposer un enregistrement audio
 * directement dans le stockage, sans passer par le serveur.
 *
 * Une requête vers le serveur est plafonnée à quelques mégaoctets ; un
 * enregistrement d'une demi-heure en pèse vingt. Le jeton ne vaut que pour
 * le dossier audio de l'organisation active, pour de l'audio, et sous la
 * taille que le modèle accepte.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  const deps = getApplicationDeps();
  const actor = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: await readSuperAdminOrgCookie() },
  );
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const organizationId = actor.activeOrganizationId;

  const auth = resolveBlobPutAuth();
  if (!auth || !("token" in auth)) {
    return NextResponse.json(
      { error: "Stockage de fichiers non configuré" },
      { status: 503 },
    );
  }

  const allowedPrefix = buildOrgBlobPath(organizationId, "meetings/audio", "");

  try {
    const json = await handleUpload({
      body,
      request,
      token: auth.token,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(allowedPrefix)) {
          throw new Error("Chemin de dépôt refusé");
        }
        return {
          allowedContentTypes: AUDIO_ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: AUDIO_MAX_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            organizationId,
            userId: actor.userId,
          }),
        };
      },
      onUploadCompleted: async () => {
        /*
          Rien à faire ici : le rendez-vous n'existe pas encore quand le
          fichier arrive. C'est l'enregistrement du formulaire qui relie
          l'audio au rendez-vous, une fois la transcription faite.
        */
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
