import { notFound, redirect } from "next/navigation";
import { ContactDetailShell } from "@/components/organisms/contact-detail-shell";
import { getApplicationDeps } from "@/lib/application-deps";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { contactsVisibleTo } from "@/src/core/domain/contact-visibility";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const visibleTo = contactsVisibleTo(actor);
  const contact = await deps.contacts.findById({
    id,
    organizationId: actor.activeOrganizationId,
    visibleTo,
  });
  if (!contact) notFound();

  // Un commercial n'y voit que ses propres rendez-vous avec ce contact.
  const meetings = await deps.meetings.listMeetingsForPersonInOrg({
    organizationId: actor.activeOrganizationId,
    personId: id,
    sellerUserId: visibleTo,
  });

  return <ContactDetailShell contact={contact} meetings={meetings} />;
}
