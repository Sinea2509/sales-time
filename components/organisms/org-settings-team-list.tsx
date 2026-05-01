"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  changeRoleAction,
  inviteMemberAction,
  removeMemberAction,
  revokeInvitationAction,
} from "@/app/[locale]/company/settings/equipe/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
export type TeamMemberRow = {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
};

export type TeamInvitationRow = {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  expiresAt: string;
  createdAt: string;
};

export function OrgSettingsTeamList({
  members,
  invitations,
  currentUserId,
}: {
  members: TeamMemberRow[];
  invitations: TeamInvitationRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

  function displayName(m: TeamMemberRow) {
    const n = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
    return n || m.email;
  }

  return (
    <div className="space-y-10">
      {msg ? (
        <p className="text-muted-foreground text-sm" role="status">
          {msg}
        </p>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Inviter un membre</h2>
        <form
          className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            startTransition(async () => {
              const r = await inviteMemberAction({
                email: inviteEmail,
                role: inviteRole,
              });
              if (!r.ok) {
                setMsg(r.message);
                return;
              }
              setMsg("Invitation envoyée.");
              setInviteEmail("");
              router.refresh();
            });
          }}
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="collegue@entreprise.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Rôle</Label>
            <select
              id="invite-role"
              className="border-input bg-background h-9 w-full min-w-[140px] rounded-md border py-1 pl-3 pr-10 text-sm outline-none focus-visible:border-input focus-visible:ring-0"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
            >
              <option value="MEMBER">Membre</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>
          <Button
            type="submit"
            disabled={pending}
            className="bg-brand shrink-0 text-white hover:bg-brand-hover"
          >
            Envoyer
          </Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Membres</h2>
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="hidden sm:table-cell">Rejoint le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.membershipId}>
                  <TableCell className="font-medium">{displayName(m)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{m.email}</TableCell>
                  <TableCell>
                    <select
                      className="border-input bg-background h-8 rounded-md border py-1 pl-3 pr-8 text-xs outline-none focus-visible:border-input focus-visible:ring-0"
                      value={m.role}
                      disabled={pending || m.userId === currentUserId}
                      onChange={(e) => {
                        const role = e.target.value as "ADMIN" | "MEMBER";
                        startTransition(async () => {
                          setMsg(null);
                          const r = await changeRoleAction(m.membershipId, role);
                          if (!r.ok) {
                            setMsg(r.message);
                            e.target.value = m.role;
                            return;
                          }
                          router.refresh();
                        });
                      }}
                    >
                      <option value="MEMBER">Membre</option>
                      <option value="ADMIN">Administrateur</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                    {new Date(m.joinedAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive h-8"
                      disabled={pending || m.userId === currentUserId}
                      onClick={() => {
                        if (!confirm(`Retirer ${m.email} de l’organisation ?`)) return;
                        startTransition(async () => {
                          setMsg(null);
                          const r = await removeMemberAction(m.membershipId);
                          if (!r.ok) {
                            setMsg(r.message);
                            return;
                          }
                          router.refresh();
                        });
                      }}
                    >
                      Retirer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-muted-foreground text-xs">
          Vous ne pouvez pas retirer votre propre compte ni retirer le dernier administrateur.
        </p>
      </section>

      {invitations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Invitations en attente</h2>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="hidden sm:table-cell">Expire le</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>{inv.role === "ADMIN" ? "Administrateur" : "Membre"}</TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                      {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={pending}
                        onClick={() => {
                          startTransition(async () => {
                            setMsg(null);
                            const r = await revokeInvitationAction(inv.id);
                            if (!r.ok) {
                              setMsg(r.message);
                              return;
                            }
                            router.refresh();
                          });
                        }}
                      >
                        Révoquer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
