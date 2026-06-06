import { notFound, redirect } from "next/navigation";
import { ContactDetailShell } from "@/components/organisms/contact-detail-shell";
import { getApplicationDeps } from "@/lib/application-deps";
import { requireDashboardActor } from "@/lib/dashboard-server-context";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const deps = getApplicationDeps();
  const contact = await deps.contacts.findById({
    id,
    organizationId: actor.activeOrganizationId,
  });
  if (!contact) notFound();

  const meetings = await deps.meetings.listMeetingsForPersonInOrg({
    organizationId: actor.activeOrganizationId,
    personId: id,
  });

  return <ContactDetailShell contact={contact} meetings={meetings} />;
}
