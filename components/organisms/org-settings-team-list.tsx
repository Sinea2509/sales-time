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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  nativeSelectChevronClasses,
  nativeSelectCompactClassName,
} from "@/components/ui/native-select-class";
import { sectionHeadingClass } from "@/lib/page-typography";
import { cn } from "@/lib/utils";
import { organizationMembershipRoleLabel } from "@/src/core/domain/organization-membership-role";

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
  currentUserEmail,
  canManageTeam,
}: {
  members: TeamMemberRow[];
  invitations: TeamInvitationRow[];
  currentUserId: string;
  currentUserEmail: string;
  canManageTeam: boolean;
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

  function sendInvitation() {
    setMsg(null);
    startTransition(async () => {
      const email = inviteEmail.trim().toLowerCase();
      if (!email) {
        setMsg("Saisissez une adresse e-mail.");
        return;
      }
      if (email === currentUserEmail.trim().toLowerCase()) {
        setMsg("Vous ne pouvez pas vous inviter vous-même.");
        return;
      }

      const r = await inviteMemberAction({
        email: inviteEmail.trim(),
        role: canManageTeam ? inviteRole : "MEMBER",
      });
      if (!r.ok) {
        setMsg(r.message);
        return;
      }
      setMsg("Invitation envoyée.");
      setInviteEmail("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-10">
      {msg ? (
        <p className="text-muted-foreground text-sm" role="status">
          {msg}
        </p>
      ) : null}

      <section>
        <Card className="w-full border-zinc-200 shadow-sm dark:border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className={sectionHeadingClass}>
              Inviter un membre
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex w-full flex-nowrap items-stretch overflow-hidden rounded-md border border-input bg-background">
              <div
                className={cn(
                  "flex min-w-0 flex-1",
                  canManageTeam ? "border-r border-input" : "",
                )}
              >
                <Input
                  id="equipe-invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collegue@entreprise.com"
                  autoComplete="email"
                  aria-label="Adresse e-mail du membre à inviter"
                  className="h-10 min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:outline-none"
                />
              </div>
              {canManageTeam ? (
                <div className="flex shrink-0 border-r border-input">
                  <select
                    id="equipe-invite-role"
                    value={inviteRole}
                    aria-label="Rôle du membre invité"
                    onChange={(e) =>
                      setInviteRole(e.target.value as "ADMIN" | "MEMBER")
                    }
                    className={cn(
                      nativeSelectChevronClasses,
                      "h-10 min-w-[9.5rem] cursor-pointer appearance-none border-0 bg-transparent py-0 pl-3 pr-10 text-sm outline-none",
                      "focus-visible:ring-0",
                      "dark:bg-transparent",
                    )}
                  >
                    <option value="MEMBER">
                      {organizationMembershipRoleLabel("MEMBER")}
                    </option>
                    <option value="ADMIN">
                      {organizationMembershipRoleLabel("ADMIN")}
                    </option>
                  </select>
                </div>
              ) : null}
              <Button
                type="button"
                disabled={pending}
                onClick={sendInvitation}
                className="h-10 shrink-0 rounded-none border-0 bg-brand px-5 text-brand-foreground hover:bg-brand-hover focus-visible:ring-0"
              >
                {pending ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className={sectionHeadingClass}>Membres</h2>
        <div className="rounded-xl border px-3 sm:px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Rejoint le
                </TableHead>
                <TableHead className="text-right">
                  {canManageTeam ? "Actions" : ""}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.membershipId}>
                  <TableCell className="font-medium">
                    {displayName(m)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {m.email}
                  </TableCell>
                  <TableCell>
                    {canManageTeam ? (
                      <select
                        className={nativeSelectCompactClassName}
                        value={m.role}
                        disabled={pending || m.userId === currentUserId}
                        onChange={(e) => {
                          const role = e.target.value as "ADMIN" | "MEMBER";
                          startTransition(async () => {
                            setMsg(null);
                            const r = await changeRoleAction(
                              m.membershipId,
                              role,
                            );
                            if (!r.ok) {
                              setMsg(r.message);
                              e.target.value = m.role;
                              return;
                            }
                            router.refresh();
                          });
                        }}
                      >
                        <option value="MEMBER">
                          {organizationMembershipRoleLabel("MEMBER")}
                        </option>
                        <option value="ADMIN">
                          {organizationMembershipRoleLabel("ADMIN")}
                        </option>
                      </select>
                    ) : (
                      organizationMembershipRoleLabel(m.role)
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                    {new Date(m.joinedAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManageTeam ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-8"
                        disabled={pending || m.userId === currentUserId}
                        onClick={() => {
                          if (
                            !confirm(`Retirer ${m.email} de l’organisation ?`)
                          )
                            return;
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
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {invitations.length > 0 ? (
        <section className="space-y-3">
          <h2 className={sectionHeadingClass}>Invitations en attente</h2>
          <div className="rounded-xl border px-3 sm:px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Expire le
                  </TableHead>
                  <TableHead className="text-right">
                    {canManageTeam ? "Action" : ""}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>
                      {organizationMembershipRoleLabel(inv.role)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                      {new Date(inv.expiresAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManageTeam ? (
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
                      ) : null}
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
