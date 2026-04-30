"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  CalendarDays,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  createOrganizationAction,
  updateOrganizationAction,
  deleteOrganizationAction,
  bulkDeleteOrganizationsAction,
} from "@/app/[locale]/admin/organizations/actions";
import { AdminExportButton } from "@/components/molecules/admin-export-button";

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  meetingCount: number;
  invitationCount: number;
};

type Props = {
  organizations: OrgRow[];
};

export function AdminOrgTable({ organizations }: Props) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<OrgRow | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<OrgRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()),
  );

  function handleCreate(formData: FormData) {
    setError(null);
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    startTransition(async () => {
      const result = await createOrganizationAction({ name, slug });
      if (!result.ok) {
        setError(result.message);
      } else {
        setCreateOpen(false);
      }
    });
  }

  function handleUpdate(formData: FormData) {
    if (!editOrg) return;
    setError(null);
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    startTransition(async () => {
      const result = await updateOrganizationAction({
        id: editOrg.id,
        name,
        slug,
      });
      if (!result.ok) {
        setError(result.message);
      } else {
        setEditOrg(null);
      }
    });
  }

  function handleDelete() {
    if (!deleteOrg) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteOrganizationAction(deleteOrg.id);
      if (!result.ok) {
        setError(result.message);
      } else {
        setDeleteOrg(null);
      }
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((o) => o.id)));
    }
  }

  function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      const result = await bulkDeleteOrganizationsAction(ids);
      if (result.ok) setSelectedIds(new Set());
    });
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Rechercher par nom, slug ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <AdminExportButton
          data={organizations}
          filename="organisations"
          columns={[
            { key: "id", label: "ID" },
            { key: "name", label: "Nom" },
            { key: "slug", label: "Slug" },
            { key: "website", label: "Site web" },
            { key: "memberCount", label: "Membres" },
            { key: "meetingCount", label: "RDV" },
            { key: "createdAt", label: "Créée le" },
          ]}
        />
        <Button onClick={() => { setError(null); setCreateOpen(true); }}>
          <Plus className="mr-1.5 size-4" />
          Nouvelle organisation
        </Button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {selectedIds.size} sélectionné(s)
          </span>
          <Button
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={handleBulkDelete}
          >
            <Trash2 className="mr-1.5 size-4" />
            Supprimer
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/60">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="size-4 rounded border-zinc-300 dark:border-zinc-600"
                  />
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                  Organisation
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                  Slug
                </th>
                <th className="hidden px-4 py-3 font-medium text-zinc-500 sm:table-cell dark:text-zinc-400">
                  Membres
                </th>
                <th className="hidden px-4 py-3 font-medium text-zinc-500 md:table-cell dark:text-zinc-400">
                  RDV
                </th>
                <th className="hidden px-4 py-3 font-medium text-zinc-500 lg:table-cell dark:text-zinc-400">
                  Créée le
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-400">
                    Aucune organisation trouvée.
                  </td>
                </tr>
              ) : (
                filtered.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                  >
                    <td className="w-10 px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(org.id)}
                        onChange={() => toggleSelect(org.id)}
                        className="size-4 rounded border-zinc-300 dark:border-zinc-600"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                          <Building2 className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/organizations/${org.id}`}
                            className="block truncate font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                          >
                            {org.name}
                          </Link>
                          {org.website && (
                            <p className="flex items-center gap-1 truncate text-xs text-zinc-400">
                              <Globe className="size-3" />
                              {org.website}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {org.slug}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3.5 sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                        <Users className="size-3.5 text-zinc-400" />
                        {org.memberCount}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3.5 md:table-cell">
                      <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300">
                        <CalendarDays className="size-3.5 text-zinc-400" />
                        {org.meetingCount}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3.5 text-zinc-500 lg:table-cell">
                      {new Date(org.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setError(null);
                            setEditOrg(org);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => {
                            setError(null);
                            setDeleteOrg(org);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-400">
            {filtered.length} organisation(s) sur {organizations.length}
          </p>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle organisation</DialogTitle>
            <DialogDescription>
              Créer une nouvelle organisation sur la plateforme.
            </DialogDescription>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nom</Label>
              <Input id="create-name" name="name" required placeholder="Acme Corp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-slug">Slug</Label>
              <Input
                id="create-slug"
                name="slug"
                required
                placeholder="acme-corp"
                pattern="[a-z0-9-]+"
              />
              <p className="text-xs text-zinc-500">
                Minuscules, chiffres et tirets uniquement.
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editOrg} onOpenChange={() => setEditOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;organisation</DialogTitle>
            <DialogDescription>
              Modifier les informations de l&apos;organisation.
            </DialogDescription>
          </DialogHeader>
          {editOrg && (
            <form action={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom</Label>
                <Input
                  id="edit-name"
                  name="name"
                  required
                  defaultValue={editOrg.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  name="slug"
                  required
                  defaultValue={editOrg.slug}
                  pattern="[a-z0-9-]+"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOrg(null)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteOrg} onOpenChange={() => setDeleteOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;organisation</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes les données associées
              (membres, rendez-vous, analyses) seront supprimées.
            </DialogDescription>
          </DialogHeader>
          {deleteOrg && (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Vous êtes sur le point de supprimer{" "}
                  <strong>{deleteOrg.name}</strong> ({deleteOrg.memberCount}{" "}
                  membre(s), {deleteOrg.meetingCount} RDV).
                </p>
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteOrg(null)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={handleDelete}
                >
                  {pending ? "Suppression..." : "Supprimer définitivement"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
