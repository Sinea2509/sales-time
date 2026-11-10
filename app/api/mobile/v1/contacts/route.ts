import {
  mobileError,
  mobileJson,
  requireMobileOrgActor,
} from "@/lib/mobile/mobile-request";
import { searchContactsByPrefix } from "@/src/core/application/search-contacts";
import { contactsVisibleTo } from "@/src/core/domain/contact-visibility";

export const dynamic = "force-dynamic";

/**
 * Les contacts du commercial dont le nom commence par ce qu'il tape : le
 * rendez-vous se rattache au bon contact au lieu d'en créer un doublon.
 */
export async function GET(request: Request) {
  const actor = await requireMobileOrgActor(request);
  if (!actor.ok) return mobileError(actor.error);

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return mobileJson({ contacts: [] });
  if (q.length > 80) return mobileError("VALIDATION");

  const hits = await searchContactsByPrefix(actor.deps, {
    organizationId: actor.organizationId,
    prefix: q,
    limit: 8,
    visibleTo: contactsVisibleTo(actor),
  });
  return mobileJson({
    contacts: hits.map((h) => ({
      id: h.id,
      name: h.displayName,
      company: h.company,
    })),
  });
}
