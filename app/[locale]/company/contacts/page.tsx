import Link from "next/link";
import { redirect } from "next/navigation";
import { makeApplicationDeps } from "@/src/adapters/composition";
import { requireDashboardActor } from "@/lib/dashboard-server-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function ContactsPage({ searchParams }: Props) {
  const actor = await requireDashboardActor();
  if (actor.kind !== "authenticated" || !actor.activeOrganizationId) {
    redirect("/company");
  }

  const sp = (await searchParams) ?? {};
  const q = typeof sp.q === "string" ? sp.q : "";

  const deps = makeApplicationDeps();
  const rows = await deps.contacts.listForOrg({
    organizationId: actor.activeOrganizationId,
    search: q || undefined,
    limit: 200,
    offset: 0,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
            Prospects et interlocuteurs enregistrés pour votre organisation.
            Liez-les aux rendez-vous depuis le formulaire « Nouveau RDV ».
          </p>
        </div>
        <Link
          href="/company/contacts/nouveau"
          className={cn(
            buttonVariants(),
            "bg-brand text-primary-foreground hover:bg-brand-hover inline-flex h-9 w-fit items-center justify-center rounded-md px-4 text-sm font-medium",
          )}
        >
          Nouveau contact
        </Link>
      </div>

      <form method="get" className="flex max-w-md gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Rechercher par nom, société, e-mail…"
          className="flex-1"
        />
        <Button type="submit" variant="secondary">
          Rechercher
        </Button>
      </form>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Société</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead className="hidden md:table-cell">Téléphone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center text-sm">
                  Aucun contact pour le moment. Créez-en un ou importez-les via
                  un rendez-vous.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/company/contacts/${r.id}`}
                      className="text-brand hover:underline"
                    >
                      {r.displayName}
                    </Link>
                  </TableCell>
                  <TableCell>{r.company ?? "—"}</TableCell>
                  <TableCell>{r.email ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{r.phone ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
