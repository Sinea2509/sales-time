import { after } from "next/server";
import { getApplicationDeps } from "@/lib/application-deps";
import { readSuperAdminOrgCookie } from "@/lib/read-super-admin-org-cookie";
import { meetingIdSchema } from "@/lib/schemas/meeting";
import { getCurrentActorContext } from "@/src/core/application/get-current-actor-context";
import { streamMeetingVisitReport } from "@/src/core/application/stream-meeting-visit-report";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const textHeaders = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
};

/**
 * Le compte rendu de visite, en texte brut envoyé au fil de l'écriture.
 *
 * Le lecteur doit appartenir à l'organisation du rendez-vous : la même règle
 * que la fiche, qui n'ouvre un rendez-vous qu'avec `activeOrganizationId`.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!meetingIdSchema.safeParse(id).success) {
    return new Response("Identifiant invalide", { status: 400 });
  }

  const deps = getApplicationDeps();
  const actor = await getCurrentActorContext(
    { auth: deps.auth },
    { superAdminElevation: await readSuperAdminOrgCookie() },
  );
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    return new Response("Non authentifié", { status: 401 });
  }

  const result = await streamMeetingVisitReport(deps, {
    organizationId: actor.activeOrganizationId,
    meetingId: id,
  });

  switch (result.kind) {
    case "stored":
      return new Response(result.text, { headers: textHeaders });
    case "not_found":
      return new Response("Rendez-vous introuvable", { status: 404 });
    case "not_ready":
      return new Response("Analyse en cours", { status: 409 });
    case "unavailable":
      return new Response(result.reason, { status: 503 });
    case "stream": {
      /*
        L'enregistrement se fait une fois la réponse partie : le lecteur ne
        doit pas attendre l'écriture en base pour voir le dernier mot.
      */
      after(result.persisted.catch(() => undefined));
      const encoder = new TextEncoder();
      const textStream = result.textStream;
      const body = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            for await (const chunk of textStream) {
              controller.enqueue(encoder.encode(chunk));
            }
            controller.close();
          } catch (cause) {
            controller.error(cause);
          }
        },
      });
      return new Response(body, { headers: textHeaders });
    }
  }
}
