import { redirect } from "next/navigation";
import { ContactCreateDialog } from "@/components/organisms/contact-create-dialog";
import { ContactsListTable } from "@/components/organisms/contacts-list-table";
import { PageHeader } from "@/components/molecules/page-header";
import { getApplicationDeps } from "@/lib/application-deps";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { listContactsForOrg } from "@/src/core/application/list-contacts-for-org";

export const dynamic = "force-dynamic";

type ContactsPageProps = {
  searchParams: Promise<{ create?: string }>;
};

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const { create } = await searchParams;

  const deps = getApplicationDeps();
  const rows = await listContactsForOrg(
    { contacts: deps.contacts },
    {
      organizationId: actor.activeOrganizationId,
      search: undefined,
      limit: 200,
      offset: 0,
    },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        actions={
          <ContactCreateDialog
            key={create === "1" ? "create-open" : "create-closed"}
            defaultOpen={create === "1"}
          />
        }
      />
      <ContactsListTable rows={rows} />
    </div>
  );
}
