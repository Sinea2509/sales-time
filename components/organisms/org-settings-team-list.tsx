"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  changeManagerAction,
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
import { managerChoicesForMember } from "@/src/core/domain/manager-assignment";
import { organizationMembershipRoleLabel } from "@/src/core/domain/organization-membership-role";

export type TeamMemberRow = {
  membershipId: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
  managerUserId: string | null;
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

  /*
    Le nom d'un rattachement déjà écrit, y compris quand il n'est plus offert
    au choix. Deux chemins y mènent et se disent autrement : le rôle Manager
    retiré par le sélecteur d'à côté laisse le rattachement en place, et la
    personne reste nommable ; `managerId` appartenant à l'utilisateur et non à
    son appartenance, un manager peut aussi avoir été déclaré depuis une autre
    organisation, et celui-là, cette page ne le connaît pas.
  */
  function libelleDuRattachement(managerUserId: string) {
    const connu = members.find((x) => x.userId === managerUserId);
    if (!connu) return "Hors de cette organisation";
    return connu.role === "ADMIN"
      ? displayName(connu)
      : `${displayName(connu)} (n'est plus manager)`;
  }

  /*
    Les choix d'une ligne : « aucun », puis les managers de l'organisation, et
    enfin le rattachement en place s'il ne figure dans aucun des précédents.
    Sans cette dernière ligne il disparaîtrait du menu : un `<select>` dont la
    valeur ne correspond à aucune option retombe sur la première, et l'écran
    annoncerait « aucun manager » alors qu'il y en a un.
  */
  function choixDeManager(m: TeamMemberRow) {
    const choix = [
      { value: "", label: "Aucun manager" },
      ...managerChoicesForMember(members, m.userId).map((c) => ({
        value: c.userId,
        label: displayName(c),
      })),
    ];
    const rattache = m.managerUserId;
    if (rattache && !choix.some((c) => c.value === rattache)) {
      choix.push({ value: rattache, label: libelleDuRattachement(rattache) });
    }
    return choix;
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
            {/*
              Les trois commandes sont soudées dans un même cadre, et ce cadre
              coupe ce qui dépasse : un anneau de focus posé à l'extérieur d'un
              segment serait rogné. C'est pourquoi ils avaient tous les trois
              annulé le leur, et pourquoi personne ne voyait plus où il était au
              clavier. L'anneau va donc à l'intérieur du segment.
            */}
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
                  className="h-10 min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:inset-ring-2 focus-visible:inset-ring-brand"
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
                      "focus-visible:inset-ring-2 focus-visible:inset-ring-brand",
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
                // Anneau clair et non violet : sur un bouton déjà peint à la
                // marque, un anneau à la marque ne se verrait pas.
                className="h-10 shrink-0 rounded-none border-0 bg-brand px-5 text-brand-foreground hover:bg-brand-hover focus-visible:inset-ring-2 focus-visible:inset-ring-brand-foreground"
              >
                {pending ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        {/*
          Le rattachement n'était écrit nulle part avant cet écran, et c'est lui
          qui fait exister « Mon équipe » : sans lui, chaque manager voit
          l'organisation entière sous ce titre. La phrase le dit, sinon la
          colonne passe pour un champ d'annuaire de plus.
        */}
        <div className="space-y-1.5">
          <h2 className={sectionHeadingClass}>Membres</h2>
          <p className="text-muted-foreground max-w-prose text-sm">
            La colonne Manager dessine les équipes : dans « Mon équipe », un
            manager retrouve les personnes qui lui sont rattachées, et lui-même.
            Tant que personne n&apos;est rattaché, chacun est classé sur
            l&apos;organisation entière.
          </p>
        </div>
        <div className="rounded-xl border px-3 sm:px-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Manager</TableHead>
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
                  <TableCell>
                    {canManageTeam ? (
                      <select
                        className={cn(
                          nativeSelectCompactClassName,
                          "min-w-[10rem]",
                        )}
                        aria-label={`Manager de ${displayName(m)}`}
                        value={m.managerUserId ?? ""}
                        disabled={pending}
                        onChange={(e) => {
                          const choisi = e.target.value || null;
                          startTransition(async () => {
                            setMsg(null);
                            const r = await changeManagerAction(
                              m.userId,
                              choisi,
                            );
                            if (!r.ok) {
                              setMsg(r.message);
                              e.target.value = m.managerUserId ?? "";
                              return;
                            }
                            router.refresh();
                          });
                        }}
                      >
                        {choixDeManager(m).map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {m.managerUserId
                          ? libelleDuRattachement(m.managerUserId)
                          : "Aucun manager"}
                      </span>
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
