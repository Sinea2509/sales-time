"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldOff,
  UserPlus,
  Mail,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  toggleUserStatusAction,
  updateUserAction,
  deleteUserAction,
  inviteUserToOrgAction,
  bulkToggleUserStatusAction,
} from "@/app/[locale]/admin/users/actions";
import { AdminExportButton } from "@/components/molecules/admin-export-button";

type UserRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileRole: string | null;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  isSuperAdmin: boolean;
  memberships: { orgId: string; orgName: string; role: "ADMIN" | "MEMBER" }[];
};

type OrgOption = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  users: UserRow[];
  organizations: OrgOption[];
};

export function AdminUserTable({ users, organizations }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ACTIVE" | "DISABLED">("all");
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [inviteUser, setInviteUser] = useState<UserRow | null>(null);
  const [inviteOrgId, setInviteOrgId] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.firstName?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      (u.lastName?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function handleToggleStatus(userId: string) {
    startTransition(async () => {
      await toggleUserStatusAction(userId);
    });
  }

  function handleUpdate(formData: FormData) {
    if (!editUser) return;
    setError(null);
    const firstName = (formData.get("firstName") as string) || null;
    const lastName = (formData.get("lastName") as string) || null;
    const email = formData.get("email") as string;
    startTransition(async () => {
      const result = await updateUserAction({
        id: editUser.id,
        firstName,
        lastName,
        email,
      });
      if (!result.ok) {
        setError(result.message);
      } else {
        setEditUser(null);
      }
    });
  }

  function handleDelete() {
    if (!deleteUser) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteUserAction(deleteUser.id);
      if (!result.ok) {
        setError(result.message);
      } else {
        setDeleteUser(null);
      }
    });
  }

  function handleInvite(formData: FormData) {
    setError(null);
    const email = formData.get("email") as string;
    if (!inviteOrgId) {
      setError("Veuillez choisir une organisation.");
      return;
    }
    startTransition(async () => {
      const result = await inviteUserToOrgAction({
        email,
        organizationId: inviteOrgId,
        role: inviteRole,
      });
      if (!result.ok) {
        setError(result.message);
      } else {
        setInviteUser(null);
        setInviteOrgId("");
        setInviteRole("MEMBER");
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
      setSelectedIds(new Set(filtered.map((u) => u.id)));
    }
  }

  function handleBulkStatus(status: "ACTIVE" | "DISABLED") {
    const ids = Array.from(selectedIds);
    startTransition(async () => {
      const result = await bulkToggleUserStatusAction(ids, status);
      if (result.ok) setSelectedIds(new Set());
    });
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Rechercher par nom, e-mail ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v: string | null) => { if (v) setStatusFilter(v as "all" | "ACTIVE" | "DISABLED"); }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="ACTIVE">Actifs</SelectItem>
            <SelectItem value="DISABLED">Bloqués</SelectItem>
          </SelectContent>
        </Select>
        <AdminExportButton
          data={users}
          filename="utilisateurs"
          columns={[
            { key: "id", label: "ID" },
            { key: "email", label: "E-mail" },
            { key: "firstName", label: "Prénom" },
            { key: "lastName", label: "Nom" },
            { key: "profileRole", label: "Rôle" },
            { key: "status", label: "Statut" },
            { key: "createdAt", label: "Inscrit le" },
          ]}
        />
        <Button onClick={() => { setError(null); setInviteOrgId(""); setInviteRole("MEMBER"); setInviteUser({} as UserRow); }}>
          <UserPlus className="mr-1.5 size-4" />
          Inviter dans une org
        </Button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {selectedIds.size} sélectionné(s)
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => handleBulkStatus("DISABLED")}
          >
            <ShieldOff className="mr-1.5 size-4" />
            Bloquer
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => handleBulkStatus("ACTIVE")}
          >
            <ShieldCheck className="mr-1.5 size-4" />
            Débloquer
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
                  Utilisateur
                </th>
                <th className="hidden px-4 py-3 font-medium text-zinc-500 sm:table-cell dark:text-zinc-400">
                  Rôle
                </th>
                <th className="hidden px-4 py-3 font-medium text-zinc-500 md:table-cell dark:text-zinc-400">
                  Organisations
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                  Statut
                </th>
                <th className="hidden px-4 py-3 font-medium text-zinc-500 lg:table-cell dark:text-zinc-400">
                  Inscrit le
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
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                  >
                    <td className="w-10 px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="size-4 rounded border-zinc-300 dark:border-zinc-600"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {(user.firstName?.[0] ?? user.email[0]).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="block truncate font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                          >
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.email}
                          </Link>
                          <p className="flex items-center gap-1 truncate text-xs text-zinc-400">
                            <Mail className="size-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3.5 sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.isSuperAdmin && (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                            Super Admin
                          </Badge>
                        )}
                        {user.profileRole && (
                          <Badge variant="secondary" className="text-xs">
                            {user.profileRole}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3.5 md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.memberships.length === 0 ? (
                          <span className="text-xs text-zinc-400">Aucune</span>
                        ) : (
                          user.memberships.slice(0, 2).map((m) => (
                            <Badge key={m.orgId} variant="outline" className="text-xs">
                              <Building2 className="mr-1 size-3" />
                              {m.orgName}
                            </Badge>
                          ))
                        )}
                        {user.memberships.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.memberships.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={
                          user.status === "ACTIVE"
                            ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300"
                        }
                      >
                        {user.status === "ACTIVE" ? "Actif" : "Bloqué"}
                      </span>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3.5 text-zinc-500 lg:table-cell">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={
                            user.status === "ACTIVE"
                              ? "Bloquer l'utilisateur"
                              : "Débloquer l'utilisateur"
                          }
                          disabled={pending}
                          onClick={() => handleToggleStatus(user.id)}
                        >
                          {user.status === "ACTIVE" ? (
                            <ShieldOff className="size-4 text-amber-500" />
                          ) : (
                            <ShieldCheck className="size-4 text-emerald-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setError(null);
                            setEditUser(user);
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
                            setDeleteUser(user);
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
            {filtered.length} utilisateur(s) sur {users.length}
          </p>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              Modifier les informations de profil de l&apos;utilisateur.
            </DialogDescription>
          </DialogHeader>
          {editUser && (
            <form action={handleUpdate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">Prénom</Label>
                  <Input
                    id="edit-firstName"
                    name="firstName"
                    defaultValue={editUser.firstName ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Nom</Label>
                  <Input
                    id="edit-lastName"
                    name="lastName"
                    defaultValue={editUser.lastName ?? ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  required
                  defaultValue={editUser.email}
                />
              </div>
              {editUser.memberships.length > 0 && (
                <div className="space-y-2">
                  <Label>Organisations</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {editUser.memberships.map((m) => (
                      <Badge key={m.orgId} variant="outline" className="text-xs">
                        {m.orgName} ({m.role})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditUser(null)}
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

      {/* Delete User Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes les données de
              l&apos;utilisateur seront supprimées.
            </DialogDescription>
          </DialogHeader>
          {deleteUser && (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Vous êtes sur le point de supprimer{" "}
                  <strong>{deleteUser.email}</strong>
                  {deleteUser.memberships.length > 0 && (
                    <>
                      {" "}
                      (membre de {deleteUser.memberships.length} organisation(s))
                    </>
                  )}
                  .
                </p>
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteUser(null)}
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

      {/* Invite to Org Dialog */}
      <Dialog open={!!inviteUser} onOpenChange={() => setInviteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter dans une organisation</DialogTitle>
            <DialogDescription>
              Envoyer une invitation par e-mail à rejoindre une organisation.
            </DialogDescription>
          </DialogHeader>
          <form action={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">E-mail</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                required
                defaultValue={inviteUser?.email ?? ""}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Organisation</Label>
              <Select value={inviteOrgId} onValueChange={(v: string | null) => setInviteOrgId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir une organisation" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={inviteRole} onValueChange={(v: string | null) => { if (v) setInviteRole(v as "ADMIN" | "MEMBER"); }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Membre</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteUser(null)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Envoi..." : "Envoyer l'invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
